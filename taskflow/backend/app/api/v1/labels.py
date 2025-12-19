from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.label import Label
from app.models.models import User, Issue
from app.schemas.schemas import LabelCreate, LabelUpdate, Label as LabelSchema
from app.core.security import get_current_user, is_manager_or_admin
from app.core.activity_logger import log_activity
from app.core.websocket_manager import manager

router = APIRouter()

@router.get("/labels", response_model=List[LabelSchema])
def get_labels(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách labels
    """
    query = db.query(Label)
    
    if search:
        query = query.filter(Label.name.ilike(f"%{search}%"))
    
    return query.order_by(Label.name).offset(skip).limit(limit).all()

@router.get("/labels/{label_id}", response_model=LabelSchema)
def get_label(
    label_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin chi tiết của label
    """
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Không tìm thấy label")
    
    return label

@router.post("/labels", response_model=LabelSchema)
async def create_label(
    label: LabelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ manager/admin tạo label
):
    """
    Tạo label mới
    """
    # Kiểm tra label đã tồn tại chưa
    existing_label = db.query(Label).filter(Label.name == label.name).first()
    if existing_label:
        raise HTTPException(status_code=400, detail="Label đã tồn tại")
    
    db_label = Label(
        **label.dict(),
        created_by=current_user.id
    )
    db.add(db_label)
    db.commit()
    db.refresh(db_label)
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="created",
        entity_type="label",
        entity_id=db_label.id,
        details={"name": label.name, "color": label.color}
    )
    
    return db_label

@router.put("/labels/{label_id}", response_model=LabelSchema)
async def update_label(
    label_id: int,
    label: LabelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ manager/admin sửa label
):
    """
    Cập nhật label
    """
    db_label = db.query(Label).filter(Label.id == label_id).first()
    if not db_label:
        raise HTTPException(status_code=404, detail="Không tìm thấy label")
    
    update_data = label.dict(exclude_unset=True)
    
    # Kiểm tra nếu đổi tên thì tên mới có trùng không
    if "name" in update_data and update_data["name"] != db_label.name:
        existing_label = db.query(Label).filter(Label.name == update_data["name"]).first()
        if existing_label and existing_label.id != label_id:
            raise HTTPException(status_code=400, detail="Tên label đã tồn tại")
    
    for key, value in update_data.items():
        setattr(db_label, key, value)
    
    db.commit()
    db.refresh(db_label)
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="updated",
        entity_type="label",
        entity_id=label_id,
        details={"updated_fields": list(update_data.keys())}
    )
    
    return db_label

@router.delete("/labels/{label_id}")
async def delete_label(
    label_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ manager/admin xóa label
):
    """
    Xóa label
    """
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Không tìm thấy label")
    
    # Kiểm tra label có đang được sử dụng không
    from app.models.label import issue_labels
    from sqlalchemy import select
    
    # Đếm số issues sử dụng label này
    stmt = select([issue_labels.c.issue_id]).where(issue_labels.c.label_id == label_id)
    result = db.execute(stmt).fetchall()
    
    if result:
        issue_count = len(result)
        raise HTTPException(
            status_code=400, 
            detail=f"Không thể xóa label đang được sử dụng bởi {issue_count} issues"
        )
    
    # Log activity trước khi xóa
    log_activity(
        db=db,
        user_id=current_user.id,
        action="deleted",
        entity_type="label",
        entity_id=label_id,
        details={"name": label.name}
    )
    
    db.delete(label)
    db.commit()
    
    return {"message": "Label đã được xóa thành công"}

@router.get("/labels/{label_id}/issues")
def get_issues_by_label(
    label_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách issues có label cụ thể
    """
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Không tìm thấy label")
    
    # Lấy issues có label này
    issues = db.query(Issue).join(Issue.labels).filter(Label.id == label_id)
    
    # Filter theo quyền
    if current_user.role not in ["admin", "manager"]:
        issues = issues.filter(
            (Issue.creator_id == current_user.id) | 
            (Issue.assignee_id == current_user.id)
        )
    
    return issues.offset(skip).limit(limit).all()

@router.get("/labels/popular")
def get_popular_labels(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách labels được sử dụng nhiều nhất
    """
    from sqlalchemy import func
    
    popular_labels = db.query(
        Label,
        func.count(Issue.id).label('issue_count')
    ).join(Label.issues)\
     .group_by(Label.id)\
     .order_by(func.count(Issue.id).desc())\
     .limit(limit)\
     .all()
    
    return [
        {
            "label": label[0],
            "issue_count": label[1]
        }
        for label in popular_labels
    ]
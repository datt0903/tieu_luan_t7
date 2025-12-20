from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Issue, User
from app.models.label import Label, issue_labels
from app.schemas.schemas import Label as LabelSchema
from app.core.security import get_current_user, is_manager_or_admin
from app.core.activity_logger import log_activity
from app.core.websocket_manager import manager

router = APIRouter()

@router.get("/issues/{issue_id}/labels", response_model=List[LabelSchema])
def get_issue_labels(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách labels của issue
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra quyền
    if current_user.role not in ["admin", "manager"]:
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền xem labels của issue này"
            )
    
    return issue.labels

@router.post("/issues/{issue_id}/labels/{label_id}")
async def add_label_to_issue(
    issue_id: int,
    label_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ manager/admin
):
    """
    Thêm label vào issue
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Không tìm thấy label")
    
    # Kiểm tra label đã được thêm chưa
    if label in issue.labels:
        raise HTTPException(status_code=400, detail="Label đã được thêm vào issue")
    
    # Thêm label
    issue.labels.append(label)
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="added_label",
        entity_type="issue",
        entity_id=issue_id,
        details={
            "label_id": label_id,
            "label_name": label.name,
            "issue_title": issue.title
        }
    )
    
    # Broadcast
    await manager.broadcast({
        "type": "issue_label_added",
        "data": {
            "issue_id": issue_id,
            "label_id": label_id,
            "label_name": label.name,
            "added_by": current_user.username
        }
    })
    
    return {"message": f"Đã thêm label '{label.name}' vào issue"}

@router.delete("/issues/{issue_id}/labels/{label_id}")
async def remove_label_from_issue(
    issue_id: int,
    label_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ manager/admin
):
    """
    Xóa label khỏi issue
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Không tìm thấy label")
    
    # Kiểm tra label có trong issue không
    if label not in issue.labels:
        raise HTTPException(status_code=400, detail="Label không có trong issue")
    
    # Xóa label
    issue.labels.remove(label)
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="removed_label",
        entity_type="issue",
        entity_id=issue_id,
        details={
            "label_id": label_id,
            "label_name": label.name,
            "issue_title": issue.title
        }
    )
    
    # Broadcast
    await manager.broadcast({
        "type": "issue_label_removed",
        "data": {
            "issue_id": issue_id,
            "label_id": label_id,
            "label_name": label.name,
            "removed_by": current_user.username
        }
    })
    
    return {"message": f"Đã xóa label '{label.name}' khỏi issue"}

@router.post("/issues/{issue_id}/labels/batch")
async def add_multiple_labels_to_issue(
    issue_id: int,
    label_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)
):
    """
    Thêm nhiều labels vào issue cùng lúc
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    added_labels = []
    for label_id in label_ids:
        label = db.query(Label).filter(Label.id == label_id).first()
        if label and label not in issue.labels:
            issue.labels.append(label)
            added_labels.append(label.name)
    
    if added_labels:
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user_id=current_user.id,
            action="added_labels_batch",
            entity_type="issue",
            entity_id=issue_id,
            details={
                "label_ids": label_ids,
                "label_names": added_labels,
                "count": len(added_labels)
            }
        )
        
        return {"message": f"Đã thêm {len(added_labels)} labels vào issue", "labels": added_labels}
    else:
        return {"message": "Không có label nào được thêm"}

@router.get("/labels/search")
def search_labels_by_issue(
    issue_id: Optional[int] = None,
    project_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tìm kiếm labels với bộ lọc
    """
    from sqlalchemy import func
    
    query = db.query(Label)
    
    if search:
        query = query.filter(Label.name.ilike(f"%{search}%"))
    
    if issue_id:
        # Lấy labels không có trong issue (để thêm vào)
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if issue:
            current_label_ids = [label.id for label in issue.labels]
            if current_label_ids:
                query = query.filter(~Label.id.in_(current_label_ids))
    
    if project_id:
        # Lấy labels của các issues trong project
        from app.models.models import Issue
        issue_ids = [issue.id for issue in db.query(Issue).filter(Issue.project_id == project_id).all()]
        if issue_ids:
            # Lấy label_ids từ các issues trong project
            stmt = select([issue_labels.c.label_id]).where(issue_labels.c.issue_id.in_(issue_ids))
            result = db.execute(stmt).fetchall()
            project_label_ids = set([row[0] for row in result])
            if project_label_ids:
                query = query.filter(Label.id.in_(project_label_ids))
    
    return query.order_by(Label.name).limit(50).all()
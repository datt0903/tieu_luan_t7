from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Issue, Project, User
from app.schemas.schemas import IssueCreate, IssueUpdate, Issue as IssueSchema, StatsResponse, IssueWithRelations
from app.core.websocket_manager import manager
from app.core.security import get_current_user, is_admin, is_manager_or_admin
from app.core.activity_logger import log_activity
from datetime import datetime

router = APIRouter()

@router.get("/issues", response_model=List[IssueSchema])
def read_issues(
    skip: int = 0, 
    limit: int = 100, 
    project_id: Optional[int] = None, 
    status: Optional[str] = None,
    assignee_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách issues với các bộ lọc
    - Chỉ users đã đăng nhập mới có thể truy cập
    - Có thể lọc theo project, status, assignee, creator, priority
    """
    query = db.query(Issue)
    
    # Áp dụng các bộ lọc
    if project_id:
        query = query.filter(Issue.project_id == project_id)
    
    if status:
        query = query.filter(Issue.status == status)
    
    if assignee_id:
        query = query.filter(Issue.assignee_id == assignee_id)
    
    if creator_id:
        query = query.filter(Issue.creator_id == creator_id)
    
    if priority:
        query = query.filter(Issue.priority == priority)
    
    # Người dùng thường chỉ xem được issues của project họ tham gia
    # Admin có thể xem tất cả
    if current_user.role not in ["admin", "manager"]:
        # Lọc chỉ những issues mà user là creator hoặc assignee
        # Hoặc issues thuộc project mà user có quyền
        query = query.filter(
            (Issue.creator_id == current_user.id) | 
            (Issue.assignee_id == current_user.id)
        )
    
    return query.order_by(Issue.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/issues/{issue_id}", response_model=IssueWithRelations)
def read_issue(
    issue_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin chi tiết của một issue
    - Kiểm tra quyền truy cập
    - Trả về cả thông tin creator và assignee
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra quyền truy cập
    if current_user.role not in ["admin", "manager"]:
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền truy cập issue này"
            )
    
    return issue

@router.post("/issues", response_model=IssueSchema)
async def create_issue(
    issue: IssueCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo issue mới
    - Tự động gán creator_id = current_user.id
    - Kiểm tra project tồn tại
    """
    project = db.query(Project).filter(Project.id == issue.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Không tìm thấy project")
    
    # Chỉ users có role member trở lên mới được tạo issue
    if current_user.role not in ["admin", "manager", "member"]:
        raise HTTPException(
            status_code=403, 
            detail="Bạn không có quyền tạo issue"
        )
    
    # Tạo issue với creator_id là user hiện tại
    issue_data = issue.dict()
    issue_data["creator_id"] = current_user.id
    
    db_issue = Issue(**issue_data)
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="created",
        entity_type="issue",
        entity_id=db_issue.id,
        details={
            "title": db_issue.title,
            "project_id": db_issue.project_id,
            "status": db_issue.status
        }
    )
    
    # Broadcast qua WebSocket
    await manager.broadcast({
        "type": "issue_created",
        "data": {
            "id": db_issue.id, 
            "title": db_issue.title, 
            "status": db_issue.status,
            "creator": current_user.username,
            "project_id": db_issue.project_id
        }
    })
    
    return db_issue

@router.put("/issues/{issue_id}", response_model=IssueSchema)
async def update_issue(
    issue_id: int, 
    issue: IssueUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật issue
    - Chỉ creator, assignee, admin hoặc manager mới được update
    - Tự động cập nhật updated_at
    """
    db_issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra quyền
    if current_user.role not in ["admin", "manager"]:
        if db_issue.creator_id != current_user.id and db_issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền cập nhật issue này"
            )
    
    # Lưu trạng thái cũ để log
    old_status = db_issue.status
    old_assignee = db_issue.assignee_id
    
    # Cập nhật dữ liệu
    update_data = issue.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_issue, key, value)
    
    # Cập nhật thời gian sửa đổi
    db_issue.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_issue)
    
    # Log activity
    log_details = {}
    if old_status != db_issue.status:
        log_details["status_changed"] = {"from": old_status, "to": db_issue.status}
    if old_assignee != db_issue.assignee_id:
        log_details["assignee_changed"] = {"from": old_assignee, "to": db_issue.assignee_id}
    
    log_activity(
        db=db,
        user_id=current_user.id,
        action="updated",
        entity_type="issue",
        entity_id=db_issue.id,
        details=log_details if log_details else {"fields_updated": list(update_data.keys())}
    )
    
    # Broadcast qua WebSocket
    await manager.broadcast({
        "type": "issue_updated",
        "data": {
            "id": db_issue.id, 
            "status": db_issue.status,
            "updated_by": current_user.username,
            "changes": list(update_data.keys())
        }
    })
    
    return db_issue

@router.delete("/issues/{issue_id}")
async def delete_issue(
    issue_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa issue
    - Chỉ admin, manager hoặc creator mới được xóa
    """
    db_issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra quyền
    if current_user.role not in ["admin", "manager"]:
        if db_issue.creator_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền xóa issue này"
            )
    
    # Log activity trước khi xóa
    log_activity(
        db=db,
        user_id=current_user.id,
        action="deleted",
        entity_type="issue",
        entity_id=issue_id,
        details={
            "title": db_issue.title,
            "project_id": db_issue.project_id
        }
    )
    
    db.delete(db_issue)
    db.commit()
    
    # Broadcast qua WebSocket
    await manager.broadcast({
        "type": "issue_deleted", 
        "data": {
            "id": issue_id,
            "deleted_by": current_user.username
        }
    })
    
    return {"message": "Issue đã được xóa thành công"}

@router.get("/statistics", response_model=StatsResponse)
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thống kê
    - Admin xem được tất cả
    - Users khác chỉ xem được thống kê của issues họ liên quan
    """
    if current_user.role in ["admin", "manager"]:
        # Admin/manager xem tất cả
        total_projects = db.query(Project).count()
        total_issues = db.query(Issue).count()
        
        # Lấy issues gần đây
        recent = db.query(Issue).order_by(Issue.created_at.desc()).limit(5).all()
    else:
        # Users thường chỉ xem issues của họ
        total_projects = db.query(Project).count()  # Vẫn xem được số project
        total_issues = db.query(Issue).filter(
            (Issue.creator_id == current_user.id) | 
            (Issue.assignee_id == current_user.id)
        ).count()
        
        # Issues gần đây của user
        recent = db.query(Issue).filter(
            (Issue.creator_id == current_user.id) | 
            (Issue.assignee_id == current_user.id)
        ).order_by(Issue.created_at.desc()).limit(5).all()
    
    # Thống kê theo status
    issues_by_status = {}
    for status in ["To Do", "In Progress", "Done"]:
        if current_user.role in ["admin", "manager"]:
            issues_by_status[status] = db.query(Issue).filter(Issue.status == status).count()
        else:
            issues_by_status[status] = db.query(Issue).filter(
                (Issue.status == status) & 
                ((Issue.creator_id == current_user.id) | (Issue.assignee_id == current_user.id))
            ).count()
    
    return StatsResponse(
        total_projects=total_projects,
        total_issues=total_issues,
        issues_by_status=issues_by_status,
        recent_issues=recent
    )

@router.get("/my/issues", response_model=List[IssueSchema])
def get_my_issues(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy issues của user hiện tại (tạo ra hoặc được gán)
    """
    query = db.query(Issue).filter(
        (Issue.creator_id == current_user.id) | 
        (Issue.assignee_id == current_user.id)
    )
    
    if status:
        query = query.filter(Issue.status == status)
    
    if priority:
        query = query.filter(Issue.priority == priority)
    
    return query.order_by(Issue.created_at.desc()).all()

@router.get("/admin/issues", response_model=List[IssueSchema])
def admin_get_all_issues(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)  # Chỉ admin mới truy cập được
):
    """
    Endpoint dành riêng cho admin để lấy tất cả issues
    """
    return db.query(Issue).order_by(Issue.created_at.desc()).offset(skip).limit(limit).all()

@router.patch("/issues/{issue_id}/assign")
async def assign_issue(
    issue_id: int,
    assignee_id: int = Query(..., description="ID của user được gán"),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ manager/admin mới được gán issue
):
    """
    Gán issue cho user khác
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra assignee có tồn tại không
    assignee = db.query(User).filter(User.id == assignee_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Không tìm thấy user được gán")
    
    old_assignee = issue.assignee_id
    issue.assignee_id = assignee_id
    issue.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(issue)
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="assigned",
        entity_type="issue",
        entity_id=issue_id,
        details={
            "old_assignee": old_assignee,
            "new_assignee": assignee_id,
            "assigner": current_user.username
        }
    )
    
    # Broadcast
    await manager.broadcast({
        "type": "issue_assigned",
        "data": {
            "issue_id": issue_id,
            "assignee_id": assignee_id,
            "assignee_name": assignee.username,
            "assigned_by": current_user.username
        }
    })
    
    return {"message": f"Issue đã được gán cho {assignee.username}"}
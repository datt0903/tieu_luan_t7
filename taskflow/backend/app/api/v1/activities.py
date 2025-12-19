from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import ActivityLog, User, Issue, Project
from app.schemas.schemas import ActivityResponse, ActivityStatsResponse
from app.core.security import get_current_user, is_manager_or_admin, is_admin
from app.core.activity_logger import (
    get_recent_activities, 
    get_user_activities, 
    get_entity_activities,
    search_activities,
    get_activity_stats
)

router = APIRouter()

@router.get("/activities", response_model=List[ActivityResponse])
def get_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ admin/manager xem được tất cả
):
    """
    Lấy danh sách hoạt động gần đây (yêu cầu quyền admin/manager)
    """
    activities = get_recent_activities(db, limit=limit, skip=skip)
    return activities

@router.get("/activities/my", response_model=List[ActivityResponse])
def get_my_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy hoạt động của user hiện tại
    """
    activities = get_user_activities(db, user_id=current_user.id, limit=limit)
    return activities

@router.get("/activities/user/{user_id}", response_model=List[ActivityResponse])
def get_user_activities_endpoint(
    user_id: int,
    limit: int = Query(30, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ admin/manager xem được người khác
):
    """
    Lấy hoạt động của một user cụ thể
    """
    # Kiểm tra user tồn tại
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    
    activities = get_user_activities(db, user_id=user_id, limit=limit)
    return activities

@router.get("/activities/issue/{issue_id}", response_model=List[ActivityResponse])
def get_issue_activities(
    issue_id: int,
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy hoạt động của một issue
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra quyền
    if current_user.role not in ["admin", "manager"]:
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền xem hoạt động của issue này"
            )
    
    activities = get_entity_activities(db, entity_type="issue", entity_id=issue_id, limit=limit)
    return activities

@router.get("/activities/project/{project_id}", response_model=List[ActivityResponse])
def get_project_activities(
    project_id: int,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy hoạt động của một project
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Không tìm thấy project")
    
    # Admin/manager xem được tất cả, users khác cần kiểm tra quyền
    if current_user.role not in ["admin", "manager"]:
        # Lấy tất cả issues của project
        issues = db.query(Issue).filter(Issue.project_id == project_id).all()
        issue_ids = [issue.id for issue in issues]
        
        # Kiểm tra xem user có liên quan đến issues nào không
        user_issues = [issue for issue in issues if 
                      issue.creator_id == current_user.id or 
                      issue.assignee_id == current_user.id]
        
        if not user_issues:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền xem hoạt động của project này"
            )
    
    # Lấy activities liên quan đến issues của project
    activities = db.query(ActivityLog).filter(
        ActivityLog.entity_type == "issue",
        ActivityLog.entity_id.in_([issue.id for issue in 
                                  db.query(Issue).filter(Issue.project_id == project_id).all()])
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    return activities

@router.get("/activities/search", response_model=List[ActivityResponse])
def search_activities_endpoint(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)  # Chỉ admin mới được search
):
    """
    Tìm kiếm hoạt động với các bộ lọc (chỉ admin)
    """
    activities = search_activities(
        db=db,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        skip=skip
    )
    return activities

@router.get("/activities/stats", response_model=ActivityStatsResponse)
def get_activities_stats(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ admin/manager
):
    """
    Lấy thống kê hoạt động
    """
    stats = get_activity_stats(db, days=days)
    return stats

@router.get("/activities/export")
def export_activities(
    format: str = Query("json", regex="^(json|csv)$"),
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)  # Chỉ admin mới được export
):
    """
    Export hoạt động ra file
    """
    from datetime import datetime, timedelta
    import csv
    from io import StringIO
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    activities = db.query(ActivityLog).filter(
        ActivityLog.created_at >= start_date,
        ActivityLog.created_at <= end_date
    ).order_by(ActivityLog.created_at.desc()).all()
    
    if format == "json":
        import json
        activities_data = []
        for activity in activities:
            activities_data.append({
                "id": activity.id,
                "action": activity.action,
                "entity_type": activity.entity_type,
                "entity_id": activity.entity_id,
                "user_id": activity.user_id,
                "details": activity.details,
                "created_at": activity.created_at.isoformat()
            })
        
        return {
            "export_date": datetime.utcnow().isoformat(),
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "total_records": len(activities),
            "activities": activities_data
        }
    
    elif format == "csv":
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(["ID", "Action", "Entity Type", "Entity ID", "User ID", "Details", "Created At"])
        
        # Write data
        for activity in activities:
            details_str = str(activity.details) if activity.details else ""
            writer.writerow([
                activity.id,
                activity.action,
                activity.entity_type,
                activity.entity_id,
                activity.user_id,
                details_str,
                activity.created_at.isoformat()
            ])
        
        output.seek(0)
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=activities_{datetime.utcnow().date()}.csv"}
        )
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Issue, Project
from app.schemas.schemas import IssueCreate, IssueUpdate, Issue, StatsResponse
from app.crud.crud_issue import crud_issue
from app.core.websocket_manager import manager
import json

router = APIRouter()

@router.get("/issues", response_model=List[Issue])
def read_issues(
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Issue)
    
    if project_id:
        query = query.filter(Issue.project_id == project_id)
    
    if status:
        query = query.filter(Issue.status == status)
    
    issues = query.offset(skip).limit(limit).all()
    return issues

@router.post("/issues", response_model=Issue)
def create_issue(issue: IssueCreate, db: Session = Depends(get_db)):
    # Check if project exists
    project = db.query(Project).filter(Project.id == issue.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_issue = crud_issue.create(db=db, obj_in=issue)
    
    # Broadcast via WebSocket
    manager.broadcast({
        "type": "issue_created",
        "data": {
            "id": db_issue.id,
            "title": db_issue.title,
            "status": db_issue.status,
            "project_id": db_issue.project_id
        }
    })
    
    return db_issue

@router.get("/issues/{issue_id}", response_model=Issue)
def read_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = crud_issue.get(db, issue_id=issue_id)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.put("/issues/{issue_id}", response_model=Issue)
def update_issue(issue_id: int, issue: IssueUpdate, db: Session = Depends(get_db)):
    db_issue = crud_issue.get(db, issue_id=issue_id)
    if db_issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    db_issue = crud_issue.update(db=db, db_obj=db_issue, obj_in=issue)
    
    # Broadcast update via WebSocket
    manager.broadcast({
        "type": "issue_updated",
        "data": {
            "id": db_issue.id,
            "title": db_issue.title,
            "status": db_issue.status,
            "project_id": db_issue.project_id
        }
    })
    
    return db_issue

@router.delete("/issues/{issue_id}")
def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = crud_issue.get(db, issue_id=issue_id)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    crud_issue.delete(db, issue_id=issue_id)
    
    # Broadcast via WebSocket
    manager.broadcast({
        "type": "issue_deleted",
        "data": {"id": issue_id}
    })
    
    return {"message": "Issue deleted successfully"}

@router.get("/statistics", response_model=StatsResponse)
def get_statistics(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    total_issues = db.query(Issue).count()
    
    # Fix: Đảm bảo key đúng và bao quát hết
    issues_by_status = {
        "To Do": db.query(Issue).filter(Issue.status == "To Do").count(),
        "In Progress": db.query(Issue).filter(Issue.status == "In Progress").count(),
        "Done": db.query(Issue).filter(Issue.status == "Done").count(),
    }
    
    # Thêm fallback nếu có status khác
    all_statuses = ["To Do", "In Progress", "Done"]
    for status in all_statuses:
        if status not in issues_by_status:
            issues_by_status[status] = 0
    
    recent_issues = db.query(Issue)\
        .order_by(Issue.created_at.desc())\
        .limit(5)\
        .all()
    
    return StatsResponse(
        total_projects=total_projects,
        total_issues=total_issues,
        issues_by_status=issues_by_status,
        recent_issues=recent_issues
    )
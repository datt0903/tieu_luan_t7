from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Issue, Project
from app.schemas.schemas import IssueCreate, IssueUpdate, Issue as IssueSchema, StatsResponse
from app.core.websocket_manager import manager

router = APIRouter()

@router.get("/issues", response_model=List[IssueSchema])
def read_issues(
    skip: int = 0, limit: int = 100, 
    project_id: Optional[int] = None, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(Issue)
    if project_id:
        query = query.filter(Issue.project_id == project_id)
    if status:
        query = query.filter(Issue.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("/issues", response_model=IssueSchema)
async def create_issue(issue: IssueCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == issue.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_issue = Issue(**issue.dict())
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    
    await manager.broadcast({
        "type": "issue_created",
        "data": {"id": db_issue.id, "title": db_issue.title, "status": db_issue.status}
    })
    return db_issue

@router.get("/issues/{issue_id}", response_model=IssueSchema)
def read_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.put("/issues/{issue_id}", response_model=IssueSchema)
async def update_issue(issue_id: int, issue: IssueUpdate, db: Session = Depends(get_db)):
    db_issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    update_data = issue.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_issue, key, value)
    
    db.commit()
    db.refresh(db_issue)
    
    await manager.broadcast({
        "type": "issue_updated",
        "data": {"id": db_issue.id, "status": db_issue.status}
    })
    return db_issue

@router.delete("/issues/{issue_id}")
async def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    db_issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    db.delete(db_issue)
    db.commit()
    await manager.broadcast({"type": "issue_deleted", "data": {"id": issue_id}})
    return {"message": "Issue deleted"}

@router.get("/statistics", response_model=StatsResponse)
def get_statistics(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    total_issues = db.query(Issue).count()
    
    issues_by_status = {}
    for status in ["To Do", "In Progress", "Done"]:
        issues_by_status[status] = db.query(Issue).filter(Issue.status == status).count()
    
    recent = db.query(Issue).order_by(Issue.created_at.desc()).limit(5).all()
    
    return StatsResponse(
        total_projects=total_projects,
        total_issues=total_issues,
        issues_by_status=issues_by_status,
        recent_issues=recent
    )
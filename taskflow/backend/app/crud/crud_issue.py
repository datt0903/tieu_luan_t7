from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.models import Issue, Project
from app.schemas.schemas import IssueCreate, IssueUpdate
from datetime import datetime

class CRUDIssue:
    def get(self, db: Session, issue_id: int) -> Optional[Issue]:
        return db.query(Issue).filter(Issue.id == issue_id).first()
    
    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Issue]:
        return db.query(Issue).offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: IssueCreate) -> Issue:
        db_obj = Issue(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, *, db_obj: Issue, obj_in: IssueUpdate) -> Issue:
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        
        db_obj.updated_at = datetime.utcnow()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, issue_id: int) -> Issue:
        obj = db.query(Issue).get(issue_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def get_by_project(self, db: Session, project_id: int) -> List[Issue]:
        return db.query(Issue).filter(Issue.project_id == project_id).all()
    
    def get_by_status(self, db: Session, status: str) -> List[Issue]:
        return db.query(Issue).filter(Issue.status == status).all()

crud_issue = CRUDIssue()
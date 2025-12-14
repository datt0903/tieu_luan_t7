from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

# --- Project ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Project(ProjectBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Issue ---
class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "To Do"
    priority: str = "Medium"
    project_id: int

class IssueCreate(IssueBase):
    pass

# QUAN TRỌNG: Tất cả field update phải là Optional để tránh lỗi 422
class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project_id: Optional[int] = None

class Issue(IssueBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Stats ---
class StatsResponse(BaseModel):
    total_projects: int
    total_issues: int
    issues_by_status: Dict[str, int]
    recent_issues: List[Issue]
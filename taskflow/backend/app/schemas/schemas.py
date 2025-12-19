from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

# -------- USER --------
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# -------- PROJECT --------
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
    owner_id: int

    class Config:
        from_attributes = True


# -------- ISSUE --------
class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "To Do"
    priority: str = "Medium"
    project_id: int
    assignee_id: Optional[int] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None

class Issue(IssueBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# -------- STATS --------
class StatsResponse(BaseModel):
    total_projects: int
    total_issues: int
    issues_by_status: Dict[str, int]
    recent_issues: List[Issue]

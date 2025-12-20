from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

# -------- AUTH & TOKEN --------
class Token(BaseModel):
    access_token: str
    token_type: str

# -------- USER --------
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Alias để hỗ trợ nếu code cũ gọi User thay vì UserResponse
User = UserResponse

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

class IssueWithRelations(IssueBase):
    id: int
    creator_id: Optional[int] = None
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None
    project: Optional[Project] = None
    class Config:
        from_attributes = True

# -------- STATS --------
class StatsResponse(BaseModel):
    total_projects: int
    total_issues: int
    issues_by_status: Dict[str, int]
    recent_issues: List[Issue]

# -------- COMMENT --------
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class Comment(CommentBase):
    id: int
    issue_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# -------- ATTACHMENT --------
class AttachmentBase(BaseModel):
    filename: str

class AttachmentCreate(AttachmentBase):
    description: Optional[str] = None

class AttachmentResponse(AttachmentBase):
    id: int
    file_path: str
    file_size: int
    mime_type: str
    issue_id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# -------- ACTIVITY LOG & STATS --------
class ActivityBase(BaseModel):
    action: str
    entity_type: str
    entity_id: int
    details: Optional[dict] = None

class ActivityResponse(ActivityBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class DailyStat(BaseModel):
    date: str
    count: int

class TypeStat(BaseModel):
    type: str
    count: int

class ActionStat(BaseModel):
    action: str
    count: int

class UserStat(BaseModel):
    user_id: int
    count: int

class ActivityStatsResponse(BaseModel):
    period: str
    total_activities: int
    daily_stats: List[DailyStat]
    type_stats: List[TypeStat]
    action_stats: List[ActionStat]
    top_users: List[UserStat]

# -------- LABEL --------
class LabelBase(BaseModel):
    name: str
    color: Optional[str] = "#3498db"
    description: Optional[str] = None

class LabelCreate(LabelBase):
    pass

class LabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class Label(LabelBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class IssueWithLabels(Issue):
    labels: List[Label] = []
    class Config:
        from_attributes = True
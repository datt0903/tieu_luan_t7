from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str
    priority: str


class IssueResponse(IssueCreate):
    id: int
    created_at: datetime

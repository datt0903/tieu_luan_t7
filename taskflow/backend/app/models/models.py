from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


# -------- USER --------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner")
    issues = relationship("Issue", back_populates="owner", foreign_keys="Issue.owner_id")
    assigned_issues = relationship("Issue", foreign_keys="Issue.assignee_id")


# -------- PROJECT --------
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="projects")

    issues = relationship(
        "Issue",
        back_populates="project",
        cascade="all, delete-orphan"
    )


# -------- ISSUE --------
class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="To Do")
    priority = Column(String, default="Medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    project_id = Column(Integer, ForeignKey("projects.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    project = relationship("Project", back_populates="issues")
    owner = relationship("User", foreign_keys=[owner_id])
    assignee = relationship("User", foreign_keys=[assignee_id])

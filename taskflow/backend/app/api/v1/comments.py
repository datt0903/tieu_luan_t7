from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Comment, Issue, User
from app.schemas.schemas import CommentCreate, CommentUpdate, Comment as CommentSchema
from app.core.security import get_current_user
from app.core.websocket_manager import manager

router = APIRouter()

@router.get("/issues/{issue_id}/comments", response_model=List[CommentSchema])
def read_comments(
    issue_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kiểm tra issue có tồn tại không
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Kiểm tra quyền truy cập issue (tương tự như trong issue endpoints)
    if current_user.role not in ["admin", "manager"]:
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    comments = db.query(Comment).filter(Comment.issue_id == issue_id).offset(skip).limit(limit).all()
    return comments

@router.post("/issues/{issue_id}/comments", response_model=CommentSchema)
async def create_comment(
    issue_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Kiểm tra quyền: ít nhất là member và có liên quan đến issue
    if current_user.role not in ["admin", "manager", "member"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Nếu là member, kiểm tra xem có phải là creator hoặc assignee không
    if current_user.role == "member":
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_comment = Comment(
        content=comment.content,
        issue_id=issue_id,
        user_id=current_user.id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Gửi thông báo qua WebSocket
    await manager.broadcast({
        "type": "comment_created",
        "data": {
            "issue_id": issue_id,
            "comment_id": db_comment.id,
            "user_id": current_user.id,
            "content": comment.content[:100]  # Gửi một phần nội dung
        }
    })
    
    return db_comment

@router.put("/comments/{comment_id}", response_model=CommentSchema)
async def update_comment(
    comment_id: int,
    comment: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Kiểm tra quyền: chỉ người tạo comment hoặc admin mới được sửa
    if db_comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = comment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_comment, key, value)
    
    db.commit()
    db.refresh(db_comment)
    
    await manager.broadcast({
        "type": "comment_updated",
        "data": {
            "comment_id": comment_id,
            "issue_id": db_comment.issue_id,
            "user_id": current_user.id
        }
    })
    
    return db_comment

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Kiểm tra quyền: chỉ người tạo comment, admin, hoặc manager của project đó (nếu có) mới được xóa
    if db_comment.user_id != current_user.id and current_user.role not in ["admin", "manager"]:
        # Nếu là manager, cần kiểm tra xem có phải là manager của project chứa issue này không
        if current_user.role == "manager":
            # Lấy issue của comment
            issue = db.query(Issue).filter(Issue.id == db_comment.issue_id).first()
            # Giả sử chúng ta có bảng Project với trường manager_id, nếu không thì bỏ qua
            # Ở đây tạm thời coi rằng manager có thể xóa comment trong project họ quản lý
            # Nhưng trong model hiện tại chưa có, nên tạm thời chỉ cho phép admin và người tạo
            pass
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(db_comment)
    db.commit()
    
    await manager.broadcast({
        "type": "comment_deleted",
        "data": {
            "comment_id": comment_id,
            "issue_id": db_comment.issue_id,
            "user_id": current_user.id
        }
    })
    
    return {"message": "Comment deleted successfully"}
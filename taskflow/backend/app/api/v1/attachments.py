import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Attachment, Issue, User
from app.schemas.schemas import AttachmentResponse, AttachmentCreate
from app.core.security import get_current_user, is_manager_or_admin
from app.core.activity_logger import log_activity

router = APIRouter()

# Cấu hình
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain"
}

# Tạo thư mục upload nếu chưa tồn tại
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_file_extension(filename: str) -> str:
    """Lấy phần mở rộng của file"""
    return Path(filename).suffix.lower()

def validate_file(file: UploadFile) -> bool:
    """Kiểm tra file hợp lệ"""
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False
    return True

@router.post("/issues/{issue_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    issue_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload file đính kèm cho issue
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra quyền
    if current_user.role not in ["admin", "manager", "member"]:
        raise HTTPException(
            status_code=403, 
            detail="Bạn không có quyền upload file"
        )
    
    # Nếu là member, kiểm tra có liên quan đến issue không
    if current_user.role == "member":
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền upload file cho issue này"
            )
    
    # Kiểm tra file
    if not validate_file(file):
        raise HTTPException(
            status_code=400, 
            detail="Loại file không được hỗ trợ"
        )
    
    # Đọc file content để kiểm tra kích thước
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File quá lớn. Kích thước tối đa: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Tạo tên file duy nhất
    unique_filename = f"{uuid.uuid4().hex}{get_file_extension(file.filename)}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Lưu file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Lưu thông tin vào database
    db_attachment = Attachment(
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        issue_id=issue_id,
        user_id=current_user.id
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="uploaded_attachment",
        entity_type="attachment",
        entity_id=db_attachment.id,
        details={
            "filename": file.filename,
            "file_size": file_size,
            "issue_id": issue_id
        }
    )
    
    return db_attachment

@router.get("/issues/{issue_id}/attachments", response_model=List[AttachmentResponse])
def get_issue_attachments(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách attachments của issue
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy issue")
    
    # Kiểm tra quyền
    if current_user.role not in ["admin", "manager"]:
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền xem attachments của issue này"
            )
    
    attachments = db.query(Attachment).filter(Attachment.issue_id == issue_id).all()
    return attachments

@router.get("/attachments/{attachment_id}", response_model=AttachmentResponse)
def get_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin attachment
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Không tìm thấy attachment")
    
    # Lấy issue để kiểm tra quyền
    issue = db.query(Issue).filter(Issue.id == attachment.issue_id).first()
    
    if current_user.role not in ["admin", "manager"]:
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền xem attachment này"
            )
    
    return attachment

@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download file attachment
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Không tìm thấy attachment")
    
    # Kiểm tra file tồn tại
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File không tồn tại trên server")
    
    # Lấy issue để kiểm tra quyền
    issue = db.query(Issue).filter(Issue.id == attachment.issue_id).first()
    
    if current_user.role not in ["admin", "manager"]:
        if issue.creator_id != current_user.id and issue.assignee_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền download file này"
            )
    
    # Log download activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="downloaded_attachment",
        entity_type="attachment",
        entity_id=attachment_id,
        details={
            "filename": attachment.filename
        }
    )
    
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.filename,
        media_type=attachment.mime_type
    )

@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa attachment
    - Chỉ admin, manager hoặc người upload mới được xóa
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Không tìm thấy attachment")
    
    # Kiểm tra quyền
    if current_user.role not in ["admin", "manager"]:
        if attachment.user_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền xóa file này"
            )
    
    # Lưu thông tin trước khi xóa
    filename = attachment.filename
    issue_id = attachment.issue_id
    
    # Xóa file trên disk
    if os.path.exists(attachment.file_path):
        try:
            os.remove(attachment.file_path)
        except Exception as e:
            print(f"Lỗi khi xóa file: {e}")
    
    # Xóa record trong database
    db.delete(attachment)
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        action="deleted_attachment",
        entity_type="attachment",
        entity_id=attachment_id,
        details={
            "filename": filename,
            "issue_id": issue_id
        }
    )
    
    return {"message": "Attachment đã được xóa thành công"}

@router.get("/attachments/stats")
def get_attachments_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(is_manager_or_admin)  # Chỉ admin/manager
):
    """
    Thống kê attachments
    """
    total_attachments = db.query(Attachment).count()
    total_size = db.query(Attachment.file_size).all()
    total_size_bytes = sum([size[0] for size in total_size if size[0]])
    
    # Thống kê theo mime type
    mime_stats = db.query(
        Attachment.mime_type,
        db.func.count(Attachment.id).label('count')
    ).group_by(Attachment.mime_type).all()
    
    return {
        "total_attachments": total_attachments,
        "total_size_bytes": total_size_bytes,
        "total_size_mb": round(total_size_bytes / (1024 * 1024), 2),
        "mime_types": [{"type": stat[0], "count": stat[1]} for stat in mime_stats]
    }
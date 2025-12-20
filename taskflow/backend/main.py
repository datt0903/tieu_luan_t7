import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.core.websocket_manager import manager

# Import các module API
from app.api.v1 import issues, projects, auth, comments, attachments, activities, issue_labels, labels

# Khởi tạo bảng dữ liệu
Base.metadata.create_all(bind=engine)

# Định nghĩa chú thích Tiếng Việt cho các nhóm API
tags_metadata = [
    {"name": "Hệ thống Xác thực", "description": "Quản lý đăng ký, đăng nhập và cấp quyền truy cập (Token)."},
    {"name": "Quản lý Dự án", "description": "Tạo, sửa, xóa và xem danh sách dự án."},
    {"name": "Quản lý Công việc", "description": "Quản lý các task (issues) trong dự án."},
    {"name": "Nhãn dán (Labels)", "description": "Quản lý nhãn và gắn nhãn cho công việc."},
    {"name": "Bình luận & Đính kèm", "description": "Trao đổi thảo luận và quản lý tệp tin đính kèm."},
]

app = FastAPI(
    title="Hệ thống TaskFlow API",
    description="""
    Hệ thống Backend hỗ trợ quản lý công việc và dự án.
    
    **Hướng dẫn sử dụng:**
    1. Truy cập mục **Hệ thống Xác thực** -> **/register** để tạo tài khoản.
    2. Nhấn nút **Authorize** màu xanh phía trên, nhập Username và Password vừa tạo để đăng nhập.
    3. Sau khi "Authorized", bạn có thể sử dụng tất cả các API bên dưới.
    """,
    version="1.0.0",
    openapi_tags=tags_metadata
)

# Cấu hình CORS cho phép kết nối từ Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các Router với prefix thống nhất
# Lưu ý: prefix="/api/v1" sẽ kết hợp với /login để tạo thành /api/v1/login
app.include_router(auth.router, prefix="/api/v1", tags=["Hệ thống Xác thực"])
app.include_router(projects.router, prefix="/api/v1", tags=["Quản lý Dự án"])
app.include_router(issues.router, prefix="/api/v1", tags=["Quản lý Công việc"])
app.include_router(labels.router, prefix="/api/v1", tags=["Nhãn dán (Labels)"])
app.include_router(issue_labels.router, prefix="/api/v1", tags=["Nhãn dán (Labels)"])
app.include_router(comments.router, prefix="/api/v1", tags=["Bình luận & Đính kèm"])
app.include_router(attachments.router, prefix="/api/v1", tags=["Bình luận & Đính kèm"])
app.include_router(activities.router, prefix="/api/v1", tags=["Lịch sử hoạt động"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        manager.disconnect(websocket)

if __name__ == "__main__":
    # Chạy server tại cổng 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
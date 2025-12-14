# TaskFlow - Project Management Tool

Công cụ quản lý dự án full-stack giống Jira với real-time update.

## Tính năng
Kanban board drag & drop
Real-time update qua WebSocket
Create/Update/Delete issue
Statistics dashboard
Responsive

## Tech stack
Backend: FastAPI + SQLAlchemy
Frontend: React + Vite
Real-time: WebSocket

## Cách chạy
### Backend
```bash
cd taskflow/backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy pydantic websockets
uvicorn app.main:app --reload --port 8000

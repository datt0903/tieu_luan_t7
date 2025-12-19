import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.core.websocket_manager import manager
# Import từ api/v1
from app.api.v1 import issues, projects, auth, comments, attachments, activity_logs

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaskFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký router với prefix api/v1
app.include_router(issues.router, prefix="/api/v1", tags=["issues"])
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(comments.router, prefix="/api/v1", tags=["comments"])
app.include_router(attachments.router, prefix="/api/v1", tags=["attachments"])
app.include_router(activity_logs.router, prefix="/api/v1", tags=["activities"])



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
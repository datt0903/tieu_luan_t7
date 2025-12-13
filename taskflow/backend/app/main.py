from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

app = FastAPI(title="TaskFlow API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database (không cần SQLAlchemy)
db = {
    "projects": [],
    "issues": [],
    "next_issue_id": 1,
    "next_project_id": 1
}

class Project(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime = datetime.now()

class Issue(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str = "To Do"
    project_id: int = 1
    assignee: str = "Unassigned"
    created_at: datetime = datetime.now()

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee: str = "Unassigned"
# WebSocket clients
ws_clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back
            for client in ws_clients:
                try:
                    await client.send_text(f"Message: {data}")
                except:
                    pass
    except:
        if websocket in ws_clients:
            ws_clients.remove(websocket)

# API Routes
@app.get("/")
def root():
    return {
        "message": "TaskFlow API is running!",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/v1/issues": "List all issues",
            "POST /api/v1/issues": "Create new issue",
            "PUT /api/v1/issues/{id}": "Update issue status",
            "GET /api/v1/statistics": "Get statistics"
        }
    }

@app.get("/api/v1/issues")
def get_issues(status: Optional[str] = None):
    issues = db["issues"]
    if status:
        return [issue for issue in issues if issue["status"] == status]
    return issues

@app.post("/api/v1/issues")
def create_issue(issue: IssueCreate):
    issue_id = db["next_issue_id"]

    new_issue = {
        "id": issue_id,
        "title": issue.title,
        "description": issue.description,
        "status": "To Do",
        "project_id": 1,
        "assignee": issue.assignee,
        "created_at": datetime.now().isoformat()
    }

    db["issues"].append(new_issue)
    db["next_issue_id"] += 1

    # Notify WebSocket clients
    for client in ws_clients:
        try:
            client.send_text(json.dumps({
                "type": "issue_created",
                "data": new_issue
            }))
        except:
            pass

    return new_issue


@app.delete("/api/v1/issues/{issue_id}")
def delete_issue(issue_id: int):
    for issue in db["issues"]:
        if issue["id"] == issue_id:
            db["issues"].remove(issue)

            # Thông báo WebSocket
            for client in ws_clients:
                try:
                    client.send_text(json.dumps({
                        "type": "issue_deleted",
                        "data": {"id": issue_id}
                    }))
                except:
                    pass

            return {"message": "Issue deleted successfully"}

    raise HTTPException(status_code=404, detail="Issue not found")



@app.put("/api/v1/issues/{issue_id}")
def update_issue(issue_id: int, status: str):
    for issue in db["issues"]:
        if issue["id"] == issue_id:
            issue["status"] = status
            
            # Notify WebSocket clients
            for client in ws_clients:
                try:
                    client.send_text(json.dumps({
                        "type": "issue_updated",
                        "data": issue
                    }))
                except:
                    pass
            
            return issue
    
    raise HTTPException(status_code=404, detail="Issue not found")

@app.get("/api/v1/statistics")
def get_statistics():
    issues = db["issues"]
    
    counts = {"To Do": 0, "In Progress": 0, "Done": 0}
    for issue in issues:
        status = issue["status"]
        if status in counts:
            counts[status] += 1
    
    return {
        "total_projects": len(db["projects"]),
        "total_issues": len(issues),
        "issues_by_status": counts,
        "recent_issues": issues[-5:] if issues else []
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting TaskFlow API on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
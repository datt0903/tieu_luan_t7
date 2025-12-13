from fastapi import WebSocket
from typing import List, Dict
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.room_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str = "general"):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if room not in self.room_connections:
            self.room_connections[room] = []
        self.room_connections[room].append(websocket)
        
        # Notify room about new connection
        await self.broadcast_to_room(
            room, 
            {"type": "notification", "message": "New user connected"}
        )

    def disconnect(self, websocket: WebSocket, room: str = "general"):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if room in self.room_connections and websocket in self.room_connections[room]:
            self.room_connections[room].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

    async def broadcast_to_room(self, room: str, message: dict):
        if room in self.room_connections:
            for connection in self.room_connections[room]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "join_room":
                room = message.get("room", "general")
                await manager.broadcast_to_room(
                    room, 
                    {"type": "notification", "message": f"User joined room {room}"}
                )
            else:
                await manager.broadcast(message)
                
    except Exception as e:
        manager.disconnect(websocket)
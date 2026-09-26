"""
Real-time broadcast layer — the "social feed" mechanic: when anyone posts
an emergency, every connected client gets pushed a live notification
immediately, the same way a social app pushes a new post to followers.

This is an in-memory connection registry, which is the right scope for a
single-process hackathon deployment (Render free tier runs one instance).
At real scale, the production upgrade path is Supabase Realtime or Redis
pub/sub across multiple backend instances — noted in ARCHITECTURE.md.
"""

import json

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, WebSocket] = {}

    async def connect(self, connection_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[connection_id] = websocket

    def disconnect(self, connection_id: str) -> None:
        self._connections.pop(connection_id, None)

    async def broadcast(self, message: dict) -> None:
        payload = json.dumps(message)
        dead: list[str] = []
        for conn_id, ws in self._connections.items():
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(conn_id)
        for conn_id in dead:
            self._connections.pop(conn_id, None)

    @property
    def connection_count(self) -> int:
        return len(self._connections)


manager = ConnectionManager()

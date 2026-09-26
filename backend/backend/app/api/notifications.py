import jwt
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth.security import decode_token
from app.database.session import get_db
from app.models.entities import Notification
from app.schemas.schemas import NotificationOut
from app.services.broadcast import manager
from app.utils.ids import gen_id

router = APIRouter(tags=["notifications"])


@router.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket, token: str = Query(...)):
    """Browsers can't set custom headers on the WS handshake, so the access
    token travels as a query param instead — same JWT, same validation."""
    try:
        payload = decode_token(token, "access")
    except jwt.PyJWTError:
        await websocket.close(code=4401)
        return

    user_id = payload["sub"]
    connection_id = f"{user_id}:{id(websocket)}"
    await manager.connect(connection_id, websocket)
    try:
        while True:
            # Clients don't need to send anything — this just keeps the
            # connection open and detects disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(connection_id)


@router.get("/api/notifications", response_model=list[NotificationOut])
def list_notifications(user_id: str | None = None, db: Session = Depends(get_db)):
    """Returns broadcast notifications (user_id IS NULL) plus any addressed
    specifically to the given user, newest first."""
    q = db.query(Notification)
    if user_id:
        q = q.filter((Notification.user_id.is_(None)) | (Notification.user_id == user_id))
    else:
        q = q.filter(Notification.user_id.is_(None))
    return q.order_by(Notification.created_at.desc()).limit(50).all()


def persist_broadcast_notification(db: Session, title: str, body: str, request_id: str | None = None) -> Notification:
    n = Notification(id=gen_id("NTF"), user_id=None, request_id=request_id, title=title, body=body, read=False)
    db.add(n)
    db.commit()
    return n

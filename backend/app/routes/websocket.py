"""
WebSocket endpoint for real-time updates.
Path: /api/ws and /api/v1/ws
Requires JWT authentication via query parameter (?token=<JWT>).
"""

from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_access_token
from app.database.session import SessionLocal
from app.repositories.user_repository import UserRepository
from app.websocket.manager import manager
from app.utilities.logger import logger

router = APIRouter()


async def authenticate_ws(websocket: WebSocket, token: Optional[str]):
    """
    Validates token, extracts user ID, and ensures user is active.
    Returns user dict or None if invalid.
    """
    if not token:
        logger.warning("[WS] Missing token in query params")
        return None

    try:
        user_id_str = decode_access_token(token)
        if not user_id_str:
            return None
        user_id = int(user_id_str)
    except Exception as e:
        logger.warning(f"[WS] Invalid or expired JWT token: {e}")
        return None

    db = SessionLocal()
    try:
        repo = UserRepository(db)
        user = repo.get_by_id(user_id)
        if not user or not user.is_active:
            logger.warning(f"[WS] User {user_id} not found or inactive")
            return None
        return {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "app_role": user.app_role.value if hasattr(user.app_role, "value") else str(user.app_role),
        }
    finally:
        db.close()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    """
    Authenticated WebSocket endpoint for real-time task updates.
    Rejects connections without a valid, active user JWT with status code 1008.
    """
    user_meta = await authenticate_ws(websocket, token)
    if not user_meta:
        # 1008 = Policy Violation (used for unauthorized WebSocket handshakes)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_meta)

    try:
        # Keep connection open and handle incoming ping/heartbeat messages from client
        while True:
            # We use receive_text to listen for heartbeat / ping or client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[WS] Exception in client loop: {e}")
        await manager.disconnect(websocket)

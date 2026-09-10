"""
Centralized WebSocket Connection Manager for WorkPulse.
Handles in-memory active WebSocket connections, user association,
disconnect cleanup, and thread-safe event broadcasting.
"""

import asyncio
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket
from app.utilities.logger import logger


class ConnectionManager:
    def __init__(self):
        # Maps WebSocket connection instance to metadata dict:
        # { "user_id": int, "email": str, "name": str, "app_role": str }
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_meta: Dict[str, Any]):
        """Accepts a WebSocket connection and stores the user context."""
        await websocket.accept()
        async with self._lock:
            self.active_connections[websocket] = user_meta
        logger.info(
            f"[WS] Connected: user_id={user_meta.get('user_id')} "
            f"role={user_meta.get('app_role')} total={len(self.active_connections)}"
        )

    async def disconnect(self, websocket: WebSocket):
        """Removes a WebSocket connection cleanly."""
        async with self._lock:
            user_meta = self.active_connections.pop(websocket, None)
        if user_meta:
            logger.info(
                f"[WS] Disconnected: user_id={user_meta.get('user_id')} "
                f"total={len(self.active_connections)}"
            )

    async def broadcast(self, event: Dict[str, Any]):
        """
        Sends a structured JSON event to all currently connected clients.
        Automatically removes stale/dead sockets.
        """
        if not self.active_connections:
            return

        message_str = json.dumps(event)
        stale_sockets: List[WebSocket] = []

        # Shallow copy keys to iterate without holding lock during send
        async with self._lock:
            sockets = list(self.active_connections.keys())

        for ws in sockets:
            try:
                await ws.send_text(message_str)
            except Exception as e:
                logger.warning(f"[WS] Failed sending to client, queuing removal: {e}")
                stale_sockets.append(ws)

        if stale_sockets:
            async with self._lock:
                for ws in stale_sockets:
                    self.active_connections.pop(ws, None)

    def broadcast_sync(self, event: Dict[str, Any]):
        """
        Helper to broadcast an event from synchronous service code.
        Dispatches safely onto the running asyncio event loop.
        """
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast(event))
        except RuntimeError:
            # If called when no event loop is running (e.g. background thread),
            # safely run it via asyncio.run
            try:
                asyncio.run(self.broadcast(event))
            except Exception as e:
                logger.error(f"[WS] Error during broadcast_sync fallback: {e}")


# Singleton instance
manager = ConnectionManager()


def create_ws_event(
    event_type: str,
    entity: str,
    action: str,
    entity_id: Optional[int] = None,
    data: Optional[Dict[str, Any]] = None,
    actor: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Creates a standardized structured WebSocket event dictionary.
    """
    actor_data = {}
    if actor:
        if hasattr(actor, "id") and hasattr(actor, "name"):
            actor_data = {
                "id": getattr(actor, "id", None),
                "name": getattr(actor, "name", "System"),
                "email": getattr(actor, "email", ""),
                "app_role": getattr(actor, "app_role", ""),
            }
        elif isinstance(actor, dict):
            actor_data = {
                "id": actor.get("id"),
                "name": actor.get("name", "System"),
                "email": actor.get("email", ""),
                "app_role": actor.get("app_role", ""),
            }

    return {
        "type": event_type,
        "entity": entity,
        "action": action,
        "entity_id": entity_id,
        "data": data or {},
        "actor": actor_data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

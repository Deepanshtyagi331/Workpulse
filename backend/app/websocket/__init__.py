"""
WebSocket module initialization.
Exposes the centralized ConnectionManager singleton and event builder.
"""

from app.websocket.manager import ConnectionManager, manager, create_ws_event

__all__ = ["ConnectionManager", "manager", "create_ws_event"]

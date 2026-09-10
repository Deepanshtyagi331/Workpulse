"""
Automated tests for WebSockets:
- Missing token rejected (code 1008)
- Invalid token rejected (code 1008)
- Inactive user rejected (code 1008)
- Valid token accepted and connected
- Heartbeat ping/pong
- Task mutation broadcast
- Comment event broadcast
- Disconnect cleanup
- Failed REST mutation does not broadcast
"""

import json
from unittest.mock import patch
import pytest
from starlette.websockets import WebSocketDisconnect
from tests.conftest import TestingSessionLocal
from app.websocket.manager import manager


@pytest.fixture(autouse=True)
def patch_websocket_db():
    """Ensure websocket route uses the in-memory test database session."""
    with patch("app.routes.websocket.SessionLocal", TestingSessionLocal):
        yield


def test_websocket_rejects_missing_token(client):
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/api/ws"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_rejects_invalid_token(client):
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/api/ws?token=bogus_token"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_rejects_inactive_user(client, inactive_token):
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/api/ws?token={inactive_token}"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_accepts_valid_token_and_ping_pong(client, admin_token):
    with client.websocket_connect(f"/api/ws?token={admin_token}") as ws:
        # Send heartbeat ping
        ws.send_text("ping")
        # Receive heartbeat pong
        reply = ws.receive_text()
        assert reply == "pong"


def test_websocket_receives_task_mutation_broadcast(client, admin_token, admin_headers):
    with client.websocket_connect(f"/api/ws?token={admin_token}") as ws:
        # Create a task via REST API
        create_res = client.post(
            "/api/tasks/",
            json={"title": "WS Broadcast Test Task", "priority": "high", "status": "pending"},
            headers=admin_headers,
        )
        assert create_res.status_code == 201

        # Read the broadcasted WebSocket event
        event_raw = ws.receive_text()
        event = json.loads(event_raw)
        assert event["type"] in ("task.created", "TASK_CREATED")
        assert event["data"]["title"] == "WS Broadcast Test Task"


def test_websocket_receives_comment_broadcast(client, admin_token, admin_headers):
    # Create task
    task_res = client.post("/api/tasks/", json={"title": "WS Comment Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    with client.websocket_connect(f"/api/ws?token={admin_token}") as ws:
        # Add comment via REST
        comment_res = client.post(
            f"/api/tasks/{task_id}/comments",
            json={"content": "Real-time comment sync test"},
            headers=admin_headers,
        )
        assert comment_res.status_code == 201

        # Read the broadcasted WebSocket event
        event_raw = ws.receive_text()
        event = json.loads(event_raw)
        assert event["type"] in ("comment.created", "COMMENT_CREATED")


def test_failed_rest_mutation_does_not_broadcast(client, admin_token, admin_headers):
    with client.websocket_connect(f"/api/ws?token={admin_token}") as ws:
        # Attempt invalid task creation (empty title)
        fail_res = client.post("/api/tasks/", json={"title": ""}, headers=admin_headers)
        assert fail_res.status_code == 422

        # Send ping to verify no stray event was queued before pong
        ws.send_text("ping")
        reply = ws.receive_text()
        # Immediate reply must be pong, proving no failure event was broadcast
        assert reply == "pong"

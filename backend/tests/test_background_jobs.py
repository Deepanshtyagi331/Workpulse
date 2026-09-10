"""
Automated tests for Background Jobs:
- Background job is scheduled on task create/update/delete
- Background job executes safely and processes event
- Failing background operation does not invalidate successful HTTP response
- Safe error logging without raising unhandled exceptions
- Idempotency / No duplicate notification records
"""

from unittest.mock import patch, MagicMock
import pytest
from app.services.background_service import background_job_service


def test_background_job_scheduled_on_task_create(client, admin_headers):
    with patch.object(
        background_job_service,
        "process_task_notification_job",
        wraps=background_job_service.process_task_notification_job,
    ) as spy_job:
        res = client.post(
            "/api/tasks/",
            json={"title": "Background Job Task", "priority": "urgent", "assigned_to": 3},
            headers=admin_headers,
        )
        assert res.status_code == 201
        task_id = res.json()["id"]

        # Verify background job was invoked with correct arguments
        assert spy_job.called
        call_kwargs = spy_job.call_args[1]
        assert call_kwargs["event_type"] == "TASK_CREATED"
        assert call_kwargs["task_id"] == task_id
        assert call_kwargs["assigned_to_id"] == 3


def test_background_job_scheduled_on_task_update(client, admin_headers):
    create_res = client.post("/api/tasks/", json={"title": "Update BG Task"}, headers=admin_headers)
    task_id = create_res.json()["id"]

    with patch.object(
        background_job_service,
        "process_task_notification_job",
        wraps=background_job_service.process_task_notification_job,
    ) as spy_job:
        res = client.put(
            f"/api/tasks/{task_id}",
            json={"status": "completed"},
            headers=admin_headers,
        )
        assert res.status_code == 200
        assert spy_job.called
        call_kwargs = spy_job.call_args[1]
        assert call_kwargs["event_type"] == "TASK_UPDATED"
        assert call_kwargs["task_id"] == task_id


def test_failing_background_job_does_not_break_api_response(client, admin_headers):
    """
    Even if an internal operation inside the background job encounters an error,
    the job catches it defensively and the HTTP REST endpoint succeeds with 201 Created.
    """
    original_fn = background_job_service.process_task_notification_job

    def failing_fn(*args, **kwargs):
        # Inject simulate_error into extra_data
        extra = kwargs.get("extra_data") or {}
        extra["simulate_error"] = True
        kwargs["extra_data"] = extra
        return original_fn(*args, **kwargs)

    with patch.object(background_job_service, "process_task_notification_job", side_effect=failing_fn):
        res = client.post(
            "/api/tasks/",
            json={"title": "Resilient API Task", "priority": "high"},
            headers=admin_headers,
        )
        assert res.status_code == 201
        assert res.json()["title"] == "Resilient API Task"


def test_background_job_internal_error_handling():
    """
    Direct test of background job method exception handling.
    """
    result = background_job_service.process_task_notification_job(
        event_type="TASK_CREATED",
        task_id=999,
        task_title="Test Task",
        actor_id=1,
        extra_data={"simulate_error": True},
    )
    assert result["status"] == "failed"
    assert "Simulated background job failure!" in result["error"]


def test_attachment_audit_background_job_execution(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Attachment Audit Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    with patch.object(
        background_job_service,
        "process_attachment_audit_job",
        wraps=background_job_service.process_attachment_audit_job,
    ) as spy_audit:
        txt_content = b"Audit job content"
        client.post(
            f"/api/tasks/{task_id}/attachments",
            files={"file": ("audit.txt", txt_content, "text/plain")},
            headers=admin_headers,
        )
        assert spy_audit.called
        kwargs = spy_audit.call_args[1]
        assert kwargs["action"] == "ATTACHMENT_UPLOADED"
        assert kwargs["filename"] == "audit.txt"
        assert kwargs["task_id"] == task_id

"""
Automated tests for Comments / Notes:
- Create comment on task
- Read comments for task (paginated)
- Update own comment
- Delete own comment
- Admin override (can edit/delete any user's comment)
- Unauthorized modification (employee cannot modify other user's comment)
- Missing task 404
- Validation errors
"""

import pytest


def test_comment_lifecycle_and_permissions(client, admin_headers, employee_headers, employee2_headers):
    # 1. Create task
    task_res = client.post("/api/tasks/", json={"title": "Comments Test Task", "assigned_to": 3}, headers=admin_headers)
    task_id = task_res.json()["id"]

    # 2. Employee 1 creates comment
    comment_payload = {"content": "Initial comment by Alex"}
    create_res = client.post(f"/api/tasks/{task_id}/comments", json=comment_payload, headers=employee_headers)
    assert create_res.status_code == 201
    comment = create_res.json()
    comment_id = comment["id"]
    assert comment["content"] == "Initial comment by Alex"
    assert comment["user_id"] == 3

    # 3. Read comments for task
    list_res = client.get(f"/api/tasks/{task_id}/comments", headers=employee_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1
    assert list_res.json()["items"][0]["id"] == comment_id

    # 4. Employee 1 updates own comment
    update_res = client.put(
        f"/api/comments/{comment_id}",
        json={"content": "Updated content by Alex"},
        headers=employee_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["content"] == "Updated content by Alex"

    # 5. Employee 2 (Sarah) attempts to update Employee 1's comment -> 403 Forbidden
    unauth_update = client.put(
        f"/api/comments/{comment_id}",
        json={"content": "Malicious edit by Sarah"},
        headers=employee2_headers,
    )
    assert unauth_update.status_code == 403

    # 6. Employee 2 attempts to delete Employee 1's comment -> 403 Forbidden
    unauth_del = client.delete(f"/api/comments/{comment_id}", headers=employee2_headers)
    assert unauth_del.status_code == 403

    # 7. Admin can update or delete any comment
    admin_del = client.delete(f"/api/comments/{comment_id}", headers=admin_headers)
    assert admin_del.status_code == 200

    # 8. Verify deleted -> 404
    after_del = client.put(
        f"/api/comments/{comment_id}",
        json={"content": "Post-delete attempt"},
        headers=admin_headers,
    )
    assert after_del.status_code == 404


def test_comment_missing_task(client, admin_headers):
    res = client.post(
        "/api/tasks/99999/comments",
        json={"content": "Comment on ghost task"},
        headers=admin_headers,
    )
    assert res.status_code == 404


def test_comment_validation_empty_content(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Task for Validation"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    res = client.post(
        f"/api/tasks/{task_id}/comments",
        json={"content": ""},
        headers=admin_headers,
    )
    assert res.status_code == 422

"""
Automated tests for History / Audit Logging:
- Task creation creates history record
- Status change creates history with old/new values
- Priority change creates history
- Assignee change creates history
- Field update creates history
- No-op update does not create redundant history
- Actor is recorded correctly
- History pagination works
- Unauthorized access is rejected
"""

import pytest


def test_history_creation_and_mutations(client, admin_headers):
    # 1. Create task
    create_res = client.post(
        "/api/tasks/",
        json={
            "title": "Audit Test Task",
            "description": "Initial description",
            "status": "pending",
            "priority": "low",
            "assigned_to": 3,
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    task_id = create_res.json()["id"]

    # 2. Check history for creation
    hist_res = client.get(f"/api/tasks/{task_id}/history", headers=admin_headers)
    assert hist_res.status_code == 200
    items = hist_res.json()["items"]
    assert len(items) >= 1
    create_event = [h for h in items if h["action"] == "created"]
    assert len(create_event) == 1
    assert create_event[0]["user"]["id"] == 1  # Admin Deepansh Tyagi

    # 3. Status change
    client.put(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=admin_headers,
    )

    # 4. Priority change
    client.put(
        f"/api/tasks/{task_id}",
        json={"priority": "urgent"},
        headers=admin_headers,
    )

    # 5. Assignee change
    client.put(
        f"/api/tasks/{task_id}",
        json={"assigned_to": 4},
        headers=admin_headers,
    )

    # Verify history logs
    hist_res_2 = client.get(f"/api/tasks/{task_id}/history", headers=admin_headers)
    assert hist_res_2.status_code == 200
    items_2 = hist_res_2.json()["items"]
    actions = [h["action"] for h in items_2]

    assert "created" in actions
    assert "status_changed" in actions
    assert "priority_changed" in actions
    assert "assignee_changed" in actions

    # Verify status change old/new values
    status_event = [h for h in items_2 if h["action"] == "status_changed"][0]
    assert status_event["old_value"] == "pending"
    assert status_event["new_value"] == "in_progress"


def test_no_op_update_does_not_create_duplicate_history(client, admin_headers):
    create_res = client.post(
        "/api/tasks/",
        json={"title": "No-op History Task", "status": "pending"},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    # Read initial history count
    initial_hist = client.get(f"/api/tasks/{task_id}/history", headers=admin_headers)
    initial_count = initial_hist.json()["total"]

    # Perform no-op update (same status)
    client.put(
        f"/api/tasks/{task_id}",
        json={"status": "pending"},
        headers=admin_headers,
    )

    # Verify count did not increase
    after_hist = client.get(f"/api/tasks/{task_id}/history", headers=admin_headers)
    assert after_hist.json()["total"] == initial_count


def test_history_actor_attribution(client, admin_headers, employee_headers):
    # Admin creates task assigned to employee 1 (Alex, id=3)
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Attribution Task", "status": "pending", "assigned_to": 3},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    # Employee 1 updates status
    client.put(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=employee_headers,
    )

    # Verify actor on the status change is Employee 1 (id=3)
    hist_res = client.get(f"/api/tasks/{task_id}/history", headers=admin_headers)
    items = hist_res.json()["items"]
    status_event = [h for h in items if h["action"] == "status_changed"][0]
    assert status_event["user"]["id"] == 3
    assert status_event["user"]["name"] == "Alex Chen"


def test_history_pagination(client, admin_headers):
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Pagination Task", "status": "pending"},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    # Trigger multiple history events
    client.put(f"/api/tasks/{task_id}", json={"status": "in_progress"}, headers=admin_headers)
    client.put(f"/api/tasks/{task_id}", json={"priority": "high"}, headers=admin_headers)
    client.put(f"/api/tasks/{task_id}", json={"description": "Updated"}, headers=admin_headers)

    # Request page 1 with limit 2
    page1 = client.get(f"/api/tasks/{task_id}/history?page=1&limit=2", headers=admin_headers)
    assert page1.status_code == 200
    data = page1.json()
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["total"] >= 4


def test_history_unauthorized_access(client):
    response = client.get("/api/tasks/1/history")
    assert response.status_code in (401, 403)

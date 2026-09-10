"""
Automated tests for Task API:
- GET /api/tasks (list, filter, search, sort, paginate)
- GET /api/tasks/{id} (details, missing 404)
- POST /api/tasks (validation errors, successful creation)
- PUT /api/tasks/{id} (update, no-op update, 404)
- DELETE /api/tasks/{id} (delete, 404)
"""

import pytest


def test_task_crud_lifecycle(client, admin_headers):
    # 1. Create task
    payload = {
        "title": "Lifecycle Task",
        "description": "Initial description",
        "status": "pending",
        "priority": "medium",
        "assigned_to": 3,
    }
    create_res = client.post("/api/tasks/", json=payload, headers=admin_headers)
    assert create_res.status_code == 201
    task = create_res.json()
    task_id = task["id"]
    assert task["title"] == "Lifecycle Task"
    assert task["status"] == "pending"

    # 2. Get task details
    get_res = client.get(f"/api/tasks/{task_id}", headers=admin_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == task_id
    assert "notes" in get_res.json()

    # 3. Update task
    update_res = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Updated Lifecycle Title", "status": "in_progress"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Lifecycle Title"
    assert update_res.json()["status"] == "in_progress"

    # 4. No-op update (same data should succeed without error)
    noop_res = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Updated Lifecycle Title"},
        headers=admin_headers,
    )
    assert noop_res.status_code == 200

    # 5. Delete task
    del_res = client.delete(f"/api/tasks/{task_id}", headers=admin_headers)
    assert del_res.status_code == 200

    # 6. Verify deleted (404)
    after_del = client.get(f"/api/tasks/{task_id}", headers=admin_headers)
    assert after_del.status_code == 404


def test_task_validation_errors(client, admin_headers):
    # Empty title
    res_empty = client.post("/api/tasks/", json={"title": ""}, headers=admin_headers)
    assert res_empty.status_code == 422

    # Invalid status
    res_bad_status = client.post(
        "/api/tasks/",
        json={"title": "Valid Title", "status": "non_existent_status"},
        headers=admin_headers,
    )
    assert res_bad_status.status_code == 422

    # Invalid priority
    res_bad_priority = client.post(
        "/api/tasks/",
        json={"title": "Valid Title", "priority": "super_mega_high"},
        headers=admin_headers,
    )
    assert res_bad_priority.status_code == 422


def test_task_not_found(client, admin_headers):
    res_get = client.get("/api/tasks/99999", headers=admin_headers)
    assert res_get.status_code == 404

    res_put = client.put("/api/tasks/99999", json={"title": "New"}, headers=admin_headers)
    assert res_put.status_code == 404

    res_del = client.delete("/api/tasks/99999", headers=admin_headers)
    assert res_del.status_code == 404


def test_task_filtering_search_sort_pagination(client, admin_headers):
    # Seed 5 tasks
    tasks_data = [
        {"title": "Bug in Authentication Service", "status": "pending", "priority": "high", "assigned_to": 3},
        {"title": "Feature Kanban Board Dnd", "status": "in_progress", "priority": "urgent", "assigned_to": 3},
        {"title": "Fix UI Navigation Overflow", "status": "completed", "priority": "low", "assigned_to": 4},
        {"title": "Refactor Audit Logging Service", "status": "pending", "priority": "medium", "assigned_to": 4},
        {"title": "Documentation OpenAPI Swagger", "status": "completed", "priority": "medium", "assigned_to": 3},
    ]
    for td in tasks_data:
        client.post("/api/tasks/", json=td, headers=admin_headers)

    # 1. Search
    search_res = client.get("/api/tasks/?search=Kanban", headers=admin_headers)
    assert search_res.status_code == 200
    items = search_res.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Feature Kanban Board Dnd"

    # 2. Status filter
    status_res = client.get("/api/tasks/?status=completed", headers=admin_headers)
    assert status_res.status_code == 200
    assert all(t["status"] == "completed" for t in status_res.json()["items"])
    assert len(status_res.json()["items"]) == 2

    # 3. Priority filter
    prio_res = client.get("/api/tasks/?priority=urgent", headers=admin_headers)
    assert prio_res.status_code == 200
    assert all(t["priority"] == "urgent" for t in prio_res.json()["items"])
    assert len(prio_res.json()["items"]) == 1

    # 4. Assignee filter
    assignee_res = client.get("/api/tasks/?assignee=4", headers=admin_headers)
    assert assignee_res.status_code == 200
    assert all(t["assigned_to"] == 4 for t in assignee_res.json()["items"])
    assert len(assignee_res.json()["items"]) == 2

    # 5. Sorting
    sort_res = client.get("/api/tasks/?sort_by=title&sort_order=asc", headers=admin_headers)
    assert sort_res.status_code == 200
    titles = [t["title"] for t in sort_res.json()["items"]]
    assert titles == sorted(titles)

    # 6. Pagination
    page1_res = client.get("/api/tasks/?page=1&limit=2", headers=admin_headers)
    assert page1_res.status_code == 200
    page1_data = page1_res.json()
    assert len(page1_data["items"]) == 2
    assert page1_data["page"] == 1
    assert page1_data["limit"] == 2
    assert page1_data["total"] == 5
    assert page1_data["total_pages"] == 3

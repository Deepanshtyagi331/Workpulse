"""
Automated tests for Dashboard, Users, and Integrations:
- Dashboard KPIs (total, pending, in_progress, completed, priorities)
- User directory (list, get, create, update, delete)
- Last-admin protection (cannot delete last admin)
- External API integrations (auth check, mock success, mock graceful fallback)
"""

from unittest.mock import patch, AsyncMock
import pytest


def test_dashboard_authenticated_kpis(client, admin_headers):
    # Seed a few tasks with known statuses and priorities
    client.post("/api/tasks/", json={"title": "Pending Task", "status": "pending", "priority": "low"}, headers=admin_headers)
    client.post("/api/tasks/", json={"title": "In Progress Task", "status": "in_progress", "priority": "high"}, headers=admin_headers)
    client.post("/api/tasks/", json={"title": "Completed Task", "status": "completed", "priority": "urgent"}, headers=admin_headers)

    res = client.get("/api/dashboard/", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_tasks" in data
    assert data["total_tasks"] >= 3
    assert "pending_tasks" in data
    assert "in_progress_tasks" in data
    assert "completed_tasks" in data
    assert "priority_distribution" in data
    assert data["pending_tasks"] >= 1
    assert data["in_progress_tasks"] >= 1
    assert data["completed_tasks"] >= 1


def test_dashboard_unauthorized(client):
    res = client.get("/api/dashboard/")
    assert res.status_code in (401, 403)


def test_users_crud_and_last_admin_protection(client, admin_headers):
    # 1. List users
    list_res = client.get("/api/users/", headers=admin_headers)
    assert list_res.status_code == 200
    users = list_res.json()["items"]
    assert len(users) >= 4

    # 2. Get specific user
    get_res = client.get("/api/users/1", headers=admin_headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Deepansh Tyagi"

    # 3. Create user
    create_res = client.post(
        "/api/users/",
        json={
            "name": "New Developer",
            "email": "dev.test@workpulse.internal",
            "password": "Password123!",
            "department": "Engineering",
            "role": "Backend Engineer",
            "app_role": "employee",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    new_user_id = create_res.json()["id"]

    # 4. Update user
    update_res = client.put(
        f"/api/users/{new_user_id}",
        json={"department": "Platform Core"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["department"] == "Platform Core"

    # 5. Delete newly created user
    del_res = client.delete(f"/api/users/{new_user_id}", headers=admin_headers)
    assert del_res.status_code == 200

    # 6. Attempt to delete Deepansh Tyagi (the only admin in this test suite)
    # Must be protected by Last-Admin protection rule
    last_admin_del = client.delete("/api/users/1", headers=admin_headers)
    assert last_admin_del.status_code in (400, 403)


def test_integrations_auth_required(client):
    res = client.get("/api/integrations/external-tasks")
    assert res.status_code in (401, 403)


@pytest.mark.anyio
async def test_integrations_mocked_success(client, admin_headers):
    mock_items = [
        {
            "external_id": 1,
            "title": "delectus aut autem",
            "completed": False,
            "source": "JSONPlaceholder",
        }
    ]
    with patch(
        "app.services.external_api_service.ExternalApiService.fetch_external_tasks",
        new_callable=AsyncMock,
    ) as mock_fetch:
        mock_fetch.return_value = {
            "source": "JSONPlaceholder",
            "count": 1,
            "items": mock_items,
        }
        res = client.get("/api/integrations/external-tasks?limit=10", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["source"] == "JSONPlaceholder"
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == "delectus aut autem"


@pytest.mark.anyio
async def test_integrations_graceful_failure(client, admin_headers):
    with patch(
        "app.services.external_api_service.ExternalApiService.fetch_external_tasks",
        new_callable=AsyncMock,
    ) as mock_fetch:
        from fastapi import HTTPException
        mock_fetch.side_effect = HTTPException(status_code=502, detail="Upstream JSONPlaceholder service unreachable.")
        res = client.get("/api/integrations/external-tasks?limit=10", headers=admin_headers)
        assert res.status_code == 502

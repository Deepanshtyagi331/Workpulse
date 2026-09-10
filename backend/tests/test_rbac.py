"""
Automated tests for RBAC (Role-Based Access Control):
- Admin permissions (task CRUD, user management, comment moderation)
- Manager permissions (task creation, task updates, restrictions)
- Employee restrictions (no task creation, only assigned task updates, no reassignment, no deletes)
"""

import pytest


def test_admin_can_create_task(client, admin_headers):
    payload = {
        "title": "Admin Created Task",
        "description": "Task created by admin",
        "priority": "high",
        "status": "pending",
        "assigned_to": 3,
    }
    response = client.post("/api/tasks/", json=payload, headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["title"] == "Admin Created Task"


def test_manager_can_create_task(client, manager_headers):
    payload = {
        "title": "Manager Created Task",
        "description": "Task created by manager",
        "priority": "medium",
        "status": "pending",
        "assigned_to": 3,
    }
    response = client.post("/api/tasks/", json=payload, headers=manager_headers)
    assert response.status_code == 201
    assert response.json()["title"] == "Manager Created Task"


def test_employee_cannot_create_task(client, employee_headers):
    payload = {
        "title": "Unauthorized Task",
        "description": "Employee attempting task creation",
        "priority": "low",
        "status": "pending",
    }
    response = client.post("/api/tasks/", json=payload, headers=employee_headers)
    assert response.status_code == 403


def test_admin_can_update_any_task(client, admin_headers):
    # Admin creates task assigned to employee 1
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Task for Admin Update", "assigned_to": 3},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    # Admin updates it
    update_res = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Admin Updated Title", "priority": "urgent"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Admin Updated Title"


def test_admin_can_delete_task(client, admin_headers):
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Task to Delete"},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    del_res = client.delete(f"/api/tasks/{task_id}", headers=admin_headers)
    assert del_res.status_code == 200


def test_manager_can_delete_task(client, manager_headers):
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Task to Delete by Manager"},
        headers=manager_headers,
    )
    task_id = create_res.json()["id"]

    del_res = client.delete(f"/api/tasks/{task_id}", headers=manager_headers)
    assert del_res.status_code == 200


def test_employee_cannot_delete_task(client, admin_headers, employee_headers):
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Employee Cannot Delete This", "assigned_to": 3},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    del_res = client.delete(f"/api/tasks/{task_id}", headers=employee_headers)
    assert del_res.status_code == 403


def test_employee_can_update_assigned_task(client, admin_headers, employee_headers):
    # Admin creates task assigned to Employee 1 (id=3)
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Assigned to Alex", "assigned_to": 3, "status": "pending"},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    # Employee 1 updates status
    update_res = client.put(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=employee_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "in_progress"


def test_employee_cannot_update_unassigned_task(client, admin_headers, employee2_headers):
    # Task assigned to Employee 1 (id=3)
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Assigned to Alex Only", "assigned_to": 3},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    # Employee 2 (Sarah, id=4) attempts update
    update_res = client.put(
        f"/api/tasks/{task_id}",
        json={"status": "completed"},
        headers=employee2_headers,
    )
    assert update_res.status_code == 403


def test_employee_cannot_reassign_task(client, admin_headers, employee_headers):
    # Task assigned to Employee 1 (id=3)
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Alex Task Reassign Test", "assigned_to": 3},
        headers=admin_headers,
    )
    task_id = create_res.json()["id"]

    # Employee 1 tries to reassign to Employee 2 (id=4)
    update_res = client.put(
        f"/api/tasks/{task_id}",
        json={"assigned_to": 4},
        headers=employee_headers,
    )
    assert update_res.status_code == 403


def test_admin_can_manage_users(client, admin_headers):
    # Create user
    create_res = client.post(
        "/api/users/",
        json={
            "name": "Admin Managed User",
            "email": "managed@workpulse.internal",
            "password": "Password123!",
            "department": "Engineering",
            "role": "Engineer",
            "app_role": "employee",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    user_id = create_res.json()["id"]

    # Update user
    update_res = client.put(
        f"/api/users/{user_id}",
        json={"name": "Updated Managed Name"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Managed Name"

    # Delete user
    del_res = client.delete(f"/api/users/{user_id}", headers=admin_headers)
    assert del_res.status_code == 200


def test_manager_cannot_create_admin_or_delete_user(client, manager_headers):
    # Manager cannot create admin account
    create_res = client.post(
        "/api/users/",
        json={
            "name": "Manager Attempt",
            "email": "mgmt_admin@workpulse.internal",
            "password": "Password123!",
            "department": "Product",
            "role": "Specialist",
            "app_role": "admin",
        },
        headers=manager_headers,
    )
    assert create_res.status_code == 403

    # Manager cannot delete user
    del_res = client.delete("/api/users/3", headers=manager_headers)
    assert del_res.status_code == 403


def test_employee_cannot_manage_users(client, employee_headers):
    # Attempt list/create/delete
    create_res = client.post(
        "/api/users/",
        json={"name": "Test", "email": "test@wp.com", "password": "pass"},
        headers=employee_headers,
    )
    assert create_res.status_code == 403

    del_res = client.delete("/api/users/2", headers=employee_headers)
    assert del_res.status_code == 403

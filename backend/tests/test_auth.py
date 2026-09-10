"""
Automated tests for Authentication:
- Register
- Login
- Invalid credentials
- /auth/me
- Missing JWT
- Invalid JWT
- Expired token
"""

from datetime import timedelta
import pytest
from app.core.security import create_access_token


def test_register_success(client):
    payload = {
        "name": "New Team Member",
        "email": "new.member@workpulse.internal",
        "password": "SecurePassword123!",
        "department": "Engineering",
        "role": "QA Engineer",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code in (200, 201)
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new.member@workpulse.internal"
    assert data["user"]["app_role"] == "employee"  # New registrations always default to employee


def test_register_duplicate_email(client):
    payload = {
        "name": "Duplicate User",
        "email": "alex.chen@workpulse.internal",  # Pre-seeded in fixture
        "password": "SecurePassword123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code in (400, 409)


def test_register_validation_short_password(client):
    payload = {
        "name": "Short Pass User",
        "email": "short@workpulse.internal",
        "password": "short",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client):
    payload = {
        "email": "tyagideepansh26@gmail.com",
        "password": "admin123",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Deepansh Tyagi"
    assert data["user"]["app_role"] == "admin"


def test_login_invalid_password(client):
    payload = {
        "email": "tyagideepansh26@gmail.com",
        "password": "wrongpassword",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code in (400, 401)


def test_login_nonexistent_email(client):
    payload = {
        "email": "nonexistent@workpulse.internal",
        "password": "admin123",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code in (400, 401)


def test_get_current_user_me(client, admin_headers):
    response = client.get("/api/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tyagideepansh26@gmail.com"
    assert data["app_role"] == "admin"


def test_protected_endpoint_without_jwt(client):
    response = client.get("/api/auth/me")
    assert response.status_code in (401, 403)


def test_protected_endpoint_invalid_jwt(client):
    headers = {"Authorization": "Bearer invalid_garbage_token"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code in (401, 403)


def test_protected_endpoint_expired_jwt(client):
    # Generate token that expired 1 hour ago
    expired_token = create_access_token(1, expires_delta=timedelta(hours=-1))
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code in (401, 403)


def test_inactive_user_rejected(client, inactive_token):
    headers = {"Authorization": f"Bearer {inactive_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code in (401, 403)

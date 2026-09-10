"""
Pytest configuration and shared test fixtures for WorkPulse.
Uses an isolated in-memory SQLite database with StaticPool to ensure
thread safety and full test isolation without mutating workpulse.db.
"""

import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.config import settings
from app.core.security import hash_password, create_access_token
from app.database.session import Base, get_db
from app.models.user import User
from app.models.task import Task
from app.models.note import Note
from app.models.task_history import TaskHistory
from app.models.attachment import Attachment

# Temporary SQLite database file for rock-solid cross-thread and test client isolation
TEST_DB_FILE = os.path.join(tempfile.gettempdir(), f"workpulse_test_{os.getpid()}.db")
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Redirect global database session and engine to test_engine
import app.database.session as app_db_session
import app.routes.websocket as app_ws_route

app_db_session.engine = test_engine
app_db_session.SessionLocal = TestingSessionLocal
app_ws_route.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Configure temporary upload directory for test attachment isolation."""
    temp_dir = tempfile.mkdtemp(prefix="workpulse_test_uploads_")
    original_upload_dir = settings.UPLOAD_DIR
    settings.UPLOAD_DIR = temp_dir
    os.makedirs(temp_dir, exist_ok=True)
    yield temp_dir
    settings.UPLOAD_DIR = original_upload_dir
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(autouse=True)
def init_test_db():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    
    # Pre-seed initial roles for RBAC testing
    db = TestingSessionLocal()
    admin_user = User(
        id=1,
        name="Deepansh Tyagi",
        email="tyagideepansh26@gmail.com",
        password_hash=hash_password("admin123"),
        department="Engineering",
        role="Lead Architect",
        app_role="admin",
        is_active=True,
    )
    manager_user = User(
        id=2,
        name="Marcus Vance",
        email="marcus.vance@workpulse.internal",
        password_hash=hash_password("manager123"),
        department="Product",
        role="Product Lead",
        app_role="manager",
        is_active=True,
    )
    employee1 = User(
        id=3,
        name="Alex Chen",
        email="alex.chen@workpulse.internal",
        password_hash=hash_password("employee123"),
        department="Engineering",
        role="Full Stack Engineer",
        app_role="employee",
        is_active=True,
    )
    employee2 = User(
        id=4,
        name="Sarah Connor",
        email="sarah.connor@workpulse.internal",
        password_hash=hash_password("employee123"),
        department="Design",
        role="UI/UX Designer",
        app_role="employee",
        is_active=True,
    )
    inactive_user = User(
        id=5,
        name="Inactive Worker",
        email="inactive@workpulse.internal",
        password_hash=hash_password("inactive123"),
        department="Operations",
        role="Contractor",
        app_role="employee",
        is_active=False,
    )
    db.add_all([admin_user, manager_user, employee1, employee2, inactive_user])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provides a fresh database session for direct inspection in tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """Provides a FastAPI TestClient bound to the isolated in-memory test database."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token():
    return create_access_token(1)


@pytest.fixture
def manager_token():
    return create_access_token(2)


@pytest.fixture
def employee_token():
    return create_access_token(3)


@pytest.fixture
def employee2_token():
    return create_access_token(4)


@pytest.fixture
def inactive_token():
    return create_access_token(5)


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def manager_headers(manager_token):
    return {"Authorization": f"Bearer {manager_token}"}


@pytest.fixture
def employee_headers(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}


@pytest.fixture
def employee2_headers(employee2_token):
    return {"Authorization": f"Bearer {employee2_token}"}

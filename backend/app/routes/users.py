from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserPaginationResponse,
)
from app.services.user_service import UserService
from app.dependencies import get_current_user
from app.dependencies.rbac import require_admin, require_admin_or_manager
from app.models.user import User as UserModel

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


# ---------------------------------------------------------------------------
# GET /users — All authenticated users can view the directory
# ---------------------------------------------------------------------------
@router.get("", response_model=UserPaginationResponse, include_in_schema=False)
@router.get(
    "/",
    response_model=UserPaginationResponse,
    summary="List & Search Users",
    description="Retrieve paginated users. All authenticated users can view the directory. "
                "Employee: read-only. Manager/Admin: management controls available.",
)
def list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service: UserService = Depends(get_user_service),
    _current_user: UserModel = Depends(get_current_user),  # Auth required; any role
):
    return service.get_users(search=search, role=role, department=department, page=page, limit=limit)


# ---------------------------------------------------------------------------
# GET /users/{id} — All authenticated users
# ---------------------------------------------------------------------------
@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get User By ID",
)
def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _current_user: UserModel = Depends(get_current_user),
):
    return service.get_user_by_id(user_id)


# ---------------------------------------------------------------------------
# POST /users — Admin or Manager only
# ---------------------------------------------------------------------------
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create User",
    description="Admin/Manager only. Managers cannot create admin accounts.",
)
def create_user(
    user_in: UserCreate,
    service: UserService = Depends(get_user_service),
    current_user: UserModel = Depends(require_admin_or_manager),
):
    return service.create_user(user_in, requesting_user=current_user)


# ---------------------------------------------------------------------------
# PUT /users/{id} — Admin or Manager only (with manager restrictions in service)
# ---------------------------------------------------------------------------
@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update User",
    description="Admin: full edit. Manager: cannot edit admins or promote to admin. Employee: 403.",
)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: UserModel = Depends(require_admin_or_manager),
):
    return service.update_user(user_id, user_in, requesting_user=current_user)


# ---------------------------------------------------------------------------
# DELETE /users/{id} — Admin only
# ---------------------------------------------------------------------------
@router.delete(
    "/{user_id}",
    response_model=UserResponse,
    summary="Delete User",
    description="Admin only. Cannot delete the last admin account.",
)
def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    current_user: UserModel = Depends(require_admin),
):
    return service.delete_user(user_id, requesting_user=current_user)

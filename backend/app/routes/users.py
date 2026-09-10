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
from app.models.user import User as UserModel

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.get(
    "",
    response_model=UserPaginationResponse,
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=UserPaginationResponse,
    summary="List & Search Users",
    description="Retrieve paginated users with database-level searching by name/email and filtering by role/department.",
)
def list_users(
    search: Optional[str] = Query(
        None,
        description="Search term matching user name or email",
    ),
    role: Optional[str] = Query(
        None,
        description="Filter by exact or partial role title",
    ),
    department: Optional[str] = Query(
        None,
        description="Filter by department name",
    ),
    page: int = Query(
        1,
        ge=1,
        description="Page number (1-indexed)",
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="Page size limit",
    ),
    service: UserService = Depends(get_user_service),
    _current_user: UserModel = Depends(get_current_user),
):
    return service.get_users(
        search=search,
        role=role,
        department=department,
        page=page,
        limit=limit,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get User By ID",
    description="Retrieve specific user profile information.",
)
def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _current_user: UserModel = Depends(get_current_user),
):
    return service.get_user_by_id(user_id)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create User",
    description="Create a new team member with unique email validation and sensible department/role values.",
)
def create_user(
    user_in: UserCreate,
    service: UserService = Depends(get_user_service),
    _current_user: UserModel = Depends(get_current_user),
):
    return service.create_user(user_in)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update User",
    description="Modify an existing user's attributes with email collision checks.",
)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    service: UserService = Depends(get_user_service),
    _current_user: UserModel = Depends(get_current_user),
):
    return service.update_user(user_id, user_in)


@router.delete(
    "/{user_id}",
    response_model=UserResponse,
    summary="Delete User",
    description="Safely removes a user, decoupling assigned tasks without data corruption.",
)
def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _current_user: UserModel = Depends(get_current_user),
):
    return service.delete_user(user_id)

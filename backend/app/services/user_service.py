import math
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.roles import UserAppRole


class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def get_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        department: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Coordinates user searching, filtering, and pagination logic.
        """
        items, total = self.repository.get_filtered_users(
            search=search,
            role=role,
            department=department,
            page=page,
            limit=limit,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 0

        return {
            "items": items,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }

    def get_user_by_id(self, user_id: int) -> User:
        """Retrieves user by ID or raises HTTP 404."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )
        return user

    def create_user(self, user_in: UserCreate, requesting_user: User) -> User:
        """
        Validates unique email address and creates a new user.

        Role escalation check:
        - Manager cannot create an admin user.
        - Employee cannot call this method (route-level 403 prevents it).
        """
        # Managers cannot create admin accounts
        if (
            requesting_user.app_role == UserAppRole.MANAGER
            and user_in.app_role == UserAppRole.ADMIN.value
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers cannot create admin accounts.",
            )

        existing_user = self.repository.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{user_in.email}' already exists",
            )
        return self.repository.create(user_in.model_dump())

    def update_user(
        self,
        user_id: int,
        user_in: UserUpdate,
        requesting_user: User,
    ) -> User:
        """
        Updates user profile with RBAC enforcement:
        - Only admins can change app_role.
        - Managers cannot edit admin accounts.
        - Managers cannot promote to admin.
        - Protect the last admin from demotion.
        """
        user = self.get_user_by_id(user_id)
        update_data = user_in.model_dump(exclude_unset=True)
        requesting_role = requesting_user.app_role

        # --- Role change enforcement ---
        if "app_role" in update_data and update_data["app_role"] is not None:
            new_role = update_data["app_role"]

            if requesting_role == UserAppRole.EMPLOYEE:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Employees cannot change user roles.",
                )

            if requesting_role == UserAppRole.MANAGER:
                if new_role == UserAppRole.ADMIN.value:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Managers cannot promote users to admin.",
                    )
                # Manager cannot edit an admin's record at all
                if user.app_role == UserAppRole.ADMIN.value:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Managers cannot modify admin accounts.",
                    )

            # Prevent demoting the last admin
            if (
                user.app_role == UserAppRole.ADMIN.value
                and new_role != UserAppRole.ADMIN.value
            ):
                admin_count = self.repository.count_by_app_role(UserAppRole.ADMIN.value)
                if admin_count <= 1:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot demote the last admin. Promote another user first.",
                    )

        # Manager cannot edit admin accounts (even without role change)
        if (
            requesting_role == UserAppRole.MANAGER
            and user.app_role == UserAppRole.ADMIN.value
            and "app_role" not in update_data
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers cannot modify admin accounts.",
            )

        # --- Email uniqueness check ---
        if "email" in update_data and update_data["email"]:
            new_email = str(update_data["email"]).strip().lower()
            if new_email != user.email.lower():
                existing_user = self.repository.get_by_email(new_email)
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Email '{new_email}' is already in use by another user",
                    )
            update_data["email"] = new_email

        return self.repository.update(user, update_data)

    def delete_user(self, user_id: int, requesting_user: User) -> UserResponse:
        """
        Safely deletes a user.
        Prevents deletion of the last admin account.
        """
        user = self.get_user_by_id(user_id)

        # Prevent deleting the last admin
        if user.app_role == UserAppRole.ADMIN.value:
            admin_count = self.repository.count_by_app_role(UserAppRole.ADMIN.value)
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete the last admin account.",
                )

        response = UserResponse.model_validate(user)
        self.repository.safe_delete_user(user.id)
        return response

    def count_users(self) -> int:
        return self.repository.count()

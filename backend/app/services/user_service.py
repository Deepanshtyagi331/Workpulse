import math
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse


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

    def create_user(self, user_in: UserCreate) -> User:
        """Validates unique email address and creates a new user."""
        existing_user = self.repository.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{user_in.email}' already exists",
            )
        return self.repository.create(user_in.model_dump())

    def update_user(self, user_id: int, user_in: UserUpdate) -> User:
        """Updates user profile and validates email uniqueness if changed."""
        user = self.get_user_by_id(user_id)
        update_data = user_in.model_dump(exclude_unset=True)

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

    def delete_user(self, user_id: int) -> UserResponse:
        """
        Safely deletes a user without violating task or foreign key constraints.
        """
        user = self.get_user_by_id(user_id)
        response = UserResponse.model_validate(user)
        self.repository.safe_delete_user(user.id)
        return response

    def count_users(self) -> int:
        return self.repository.count()

"""
AuthService: registration, login, and current-user retrieval.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, CurrentUserResponse


def _make_avatar_text(name: str) -> str:
    """Generate up to 2-character avatar initials from a full name."""
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper() if name else "??"


def _to_current_user(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        department=user.department,
        role=user.role,
        app_role=user.app_role or "employee",
        is_active=user.is_active,
        avatarText=_make_avatar_text(user.name),
    )


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, data: RegisterRequest) -> TokenResponse:
        """
        Registers a new user. Raises 400 on duplicate email.
        Hashes the password before storage. Returns a JWT token.
        """
        existing = self.repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{data.email}' already exists.",
            )

        user = User(
            name=data.name.strip(),
            email=data.email.strip().lower(),
            password_hash=hash_password(data.password),
            department=data.department.strip(),
            role=data.role.strip(),
            is_active=True,
        )
        self.repo.db.add(user)
        self.repo.db.commit()
        self.repo.db.refresh(user)

        token = create_access_token(subject=user.id)
        return TokenResponse(access_token=token, user=_to_current_user(user))

    def login(self, data: LoginRequest) -> TokenResponse:
        """
        Authenticates a user by email + password.
        Raises 401 for wrong credentials or inactive accounts.
        """
        user = self.repo.get_by_email(data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not configured for password login. Contact an administrator.",
            )

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account has been deactivated. Contact an administrator.",
            )

        token = create_access_token(subject=user.id)
        return TokenResponse(access_token=token, user=_to_current_user(user))

    def get_current_user_profile(self, user: User) -> CurrentUserResponse:
        """Returns the safe profile of an already-authenticated user."""
        return _to_current_user(user)

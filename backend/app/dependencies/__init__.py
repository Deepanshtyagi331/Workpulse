"""
FastAPI dependency: get_current_user.

Reads the Authorization: Bearer <JWT> header, validates the token,
loads the user from the database, and verifies the account is active.
Returns the authenticated User model object.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

# HTTPBearer scheme — shows a padlock on protected endpoints in Swagger UI
bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Reusable dependency that authenticates an incoming request.

    Steps:
    1. Extracts the Bearer token from the Authorization header.
    2. Decodes and validates the JWT (checks signature + expiry).
    3. Extracts the user ID from the 'sub' claim.
    4. Loads the User record from the database.
    5. Verifies the user exists and is active.

    Raises:
        401 UNAUTHORIZED — missing/invalid/expired token, or user not found/inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        user_id_str = decode_access_token(credentials.credentials)
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account has been deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

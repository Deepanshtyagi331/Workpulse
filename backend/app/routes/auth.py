"""
Authentication routes: /auth/register, /auth/login, /auth/me, /auth/logout
"""

from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, CurrentUserResponse
from app.services.auth_service import AuthService

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=201,
    summary="Register New Account",
    description=(
        "Create a new WorkPulse account. Returns a JWT access token on success. "
        "Validates email uniqueness, minimum password length, and required fields."
    ),
)
def register(
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return service.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login / Obtain Token",
    description=(
        "Authenticate with email and password. Returns a JWT access token and "
        "the authenticated user's safe profile. Use the token as: "
        "Authorization: Bearer <token>"
    ),
)
def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return service.login(data)


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Get Authenticated User",
    description="Returns the profile of the currently authenticated user. Requires Bearer token.",
)
def get_me(
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> CurrentUserResponse:
    return service.get_current_user_profile(current_user)


@router.post(
    "/logout",
    summary="Logout",
    description=(
        "Stateless logout endpoint. JWT tokens are client-side; "
        "the frontend should discard the stored token. "
        "This endpoint is a no-op convenience stub."
    ),
)
def logout() -> dict:
    return {"message": "Logged out successfully. Please discard your access token."}

"""
Pydantic schemas for authentication: register, login, token response, current user.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.core.roles import UserAppRole


class RegisterRequest(BaseModel):
    """Payload for new user registration. New users always start as 'employee'."""

    name: str = Field(..., min_length=1, max_length=100, description="Full name of the team member")
    email: EmailStr = Field(..., description="Corporate email address (must be unique)")
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password (min 8 chars)")
    department: str = Field(default="Engineering", min_length=2, max_length=100)
    role: str = Field(default="Member", min_length=2, max_length=100)
    # Self-registration always yields employee; admins can promote via PUT /api/users/{id}
    app_role: str = Field(default=UserAppRole.EMPLOYEE.value, exclude=True)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Jane Doe",
                "email": "jane.doe@example.com",
                "password": "SecurePassword123!",
                "department": "Engineering",
                "role": "Software Engineer",
            }
        }
    )


class LoginRequest(BaseModel):
    """Payload for user authentication."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "alex.chen@workpulse.internal",
                "password": "SamplePassword123!",
            }
        }
    )


class CurrentUserResponse(BaseModel):
    """Safe user profile returned on authentication — never includes password fields."""

    id: int
    name: str
    email: EmailStr
    department: str
    role: str          # Organizational job title
    app_role: str      # Application authorization role: admin | manager | employee
    is_active: bool
    avatarText: str = ""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Deepansh Tyagi",
                "email": "tyagideepansh26@gmail.com",
                "department": "Engineering",
                "role": "Lead Architect",
                "app_role": "admin",
                "is_active": True,
                "avatarText": "DT",
            }
        },
    )


class TokenResponse(BaseModel):
    """Response returned after successful login or registration."""

    access_token: str
    token_type: str = "bearer"
    user: CurrentUserResponse

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "name": "Deepansh Tyagi",
                    "email": "tyagideepansh26@gmail.com",
                    "department": "Engineering",
                    "role": "Lead Architect",
                    "app_role": "admin",
                    "is_active": True,
                    "avatarText": "DT",
                },
            }
        }
    )

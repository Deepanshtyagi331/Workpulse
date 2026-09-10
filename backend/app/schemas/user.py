from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

from app.core.roles import UserAppRole

# Valid app roles as strings
VALID_APP_ROLES = {r.value for r in UserAppRole}


class UserBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Full name of the team member",
    )
    email: EmailStr = Field(
        ...,
        description="Unique corporate email address",
    )
    department: str = Field(
        default="Engineering",
        min_length=1,
        max_length=100,
        description="Department or team division",
    )
    role: str = Field(
        default="Member",
        min_length=1,
        max_length=100,
        description="Organizational job title",
    )
    is_active: bool = Field(
        default=True,
        description="Active account status indicator",
    )

    @field_validator("department")
    @classmethod
    def validate_department(cls, v: str) -> str:
        v_clean = v.strip()
        if len(v_clean) < 2:
            raise ValueError("Department must be at least 2 non-whitespace characters long")
        return v_clean

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        v_clean = v.strip()
        if len(v_clean) < 2:
            raise ValueError("Role must be at least 2 non-whitespace characters long")
        return v_clean


class UserCreate(UserBase):
    """Schema for creating a user. app_role defaults to 'employee'."""
    app_role: str = Field(
        default=UserAppRole.EMPLOYEE.value,
        description="Application authorization role: admin | manager | employee",
    )

    @field_validator("app_role")
    @classmethod
    def validate_app_role(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if v_clean not in VALID_APP_ROLES:
            raise ValueError(f"app_role must be one of: {', '.join(sorted(VALID_APP_ROLES))}")
        return v_clean


class UserUpdate(BaseModel):
    """Schema for updating a user. All fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None
    app_role: Optional[str] = Field(
        None,
        description="Application authorization role: admin | manager | employee",
    )

    @field_validator("department")
    @classmethod
    def validate_department_update(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip()
            if len(v_clean) < 2:
                raise ValueError("Department must be at least 2 non-whitespace characters long")
            return v_clean
        return v

    @field_validator("role")
    @classmethod
    def validate_role_update(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip()
            if len(v_clean) < 2:
                raise ValueError("Role must be at least 2 non-whitespace characters long")
            return v_clean
        return v

    @field_validator("app_role")
    @classmethod
    def validate_app_role_update(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip().lower()
            if v_clean not in VALID_APP_ROLES:
                raise ValueError(f"app_role must be one of: {', '.join(sorted(VALID_APP_ROLES))}")
            return v_clean
        return v


class UserSummary(BaseModel):
    """Lightweight user summary for embedding inside task and comment responses."""
    id: int
    name: str
    email: EmailStr
    department: str
    role: str
    app_role: str

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    id: int
    app_role: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPaginationResponse(BaseModel):
    items: List[UserResponse]
    page: int
    limit: int
    total: int
    total_pages: int

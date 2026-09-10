from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


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
        max_length=50,
        description="Organizational role or title",
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
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated name",
    )
    email: Optional[EmailStr] = Field(
        None,
        description="Updated email address",
    )
    department: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated department",
    )
    role: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Updated role",
    )
    is_active: Optional[bool] = Field(
        None,
        description="Updated status",
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


class UserSummary(BaseModel):
    """Lightweight user summary for embedding inside task and comment responses."""
    id: int
    name: str
    email: EmailStr
    department: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPaginationResponse(BaseModel):
    items: List[UserResponse]
    page: int
    limit: int
    total: int
    total_pages: int

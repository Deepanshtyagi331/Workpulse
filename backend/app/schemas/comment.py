from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserSummary


class CommentBase(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=3000,
        description="Text content of the comment or note",
    )


class CommentCreate(CommentBase):
    user_id: int = Field(
        ...,
        gt=0,
        description="ID of the author creating the comment",
    )
    task_id: Optional[int] = Field(
        None,
        gt=0,
        description="Optional ID of the task (defaults to URL path parameter)",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "Updated the acceptance criteria and completed migration tests.",
                "user_id": 1,
            }
        }
    )


class CommentUpdate(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=3000,
        description="Updated text content of the comment",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "Minor edit: Completed migration tests across all staging environments.",
            }
        }
    )


class CommentResponse(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    author: Optional[UserSummary] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 15,
                "task_id": 42,
                "user_id": 1,
                "content": "Updated the acceptance criteria and completed migration tests.",
                "created_at": "2026-09-10T12:15:00Z",
                "updated_at": "2026-09-10T12:15:00Z",
                "author": {
                    "id": 1,
                    "name": "Deepansh Tyagi",
                    "email": "tyagideepansh26@gmail.com",
                    "role": "Lead Architect",
                    "app_role": "admin",
                },
            }
        },
    )


class CommentPaginationResponse(BaseModel):
    items: List[CommentResponse]
    page: int
    limit: int
    total: int
    total_pages: int

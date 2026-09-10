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


class CommentUpdate(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=3000,
        description="Updated text content of the comment",
    )


class CommentResponse(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    author: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class CommentPaginationResponse(BaseModel):
    items: List[CommentResponse]
    page: int
    limit: int
    total: int
    total_pages: int

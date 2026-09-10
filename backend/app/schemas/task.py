from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.task import TaskStatus, TaskPriority
from app.schemas.user import UserSummary
from app.schemas.comment import CommentResponse

ALLOWED_STATUSES = {s.value for s in TaskStatus}
ALLOWED_PRIORITIES = {p.value for p in TaskPriority}


class TaskBase(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Title of the task (1-200 characters)",
    )
    description: Optional[str] = Field(
        None,
        max_length=5000,
        description="Optional detailed description of the task",
    )
    status: str = Field(
        default=TaskStatus.PENDING.value,
        description="Task lifecycle status: pending, in_progress, completed, blocked",
    )
    priority: str = Field(
        default=TaskPriority.MEDIUM.value,
        description="Task urgency priority: low, medium, high, urgent",
    )
    assigned_to: Optional[int] = Field(
        None,
        gt=0,
        description="Optional User ID referencing the assigned team member",
    )
    due_date: Optional[datetime] = Field(
        None,
        description="Optional target due date and time for task completion",
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v is not None:
            v_clean = v.lower().strip()
            if v_clean not in ALLOWED_STATUSES:
                allowed_str = ", ".join(sorted(ALLOWED_STATUSES))
                raise ValueError(f"Invalid status '{v}'. Allowed statuses are: {allowed_str}")
            return v_clean
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v is not None:
            v_clean = v.lower().strip()
            if v_clean not in ALLOWED_PRIORITIES:
                allowed_str = ", ".join(sorted(ALLOWED_PRIORITIES))
                raise ValueError(f"Invalid priority '{v}'. Allowed priorities are: {allowed_str}")
            return v_clean
        return v


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Updated task title",
    )
    description: Optional[str] = Field(
        None,
        max_length=5000,
        description="Updated description",
    )
    status: Optional[str] = Field(
        None,
        description="Updated status (pending, in_progress, completed, blocked)",
    )
    priority: Optional[str] = Field(
        None,
        description="Updated priority (low, medium, high, urgent)",
    )
    assigned_to: Optional[int] = Field(
        None,
        gt=0,
        description="Updated assigned User ID",
    )
    due_date: Optional[datetime] = Field(
        None,
        description="Updated due date",
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.lower().strip()
            if v_clean not in ALLOWED_STATUSES:
                allowed_str = ", ".join(sorted(ALLOWED_STATUSES))
                raise ValueError(f"Invalid status '{v}'. Allowed statuses are: {allowed_str}")
            return v_clean
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.lower().strip()
            if v_clean not in ALLOWED_PRIORITIES:
                allowed_str = ", ".join(sorted(ALLOWED_PRIORITIES))
                raise ValueError(f"Invalid priority '{v}'. Allowed priorities are: {allowed_str}")
            return v_clean
        return v


class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class TaskDetailResponse(TaskResponse):
    """Detailed task representation including all nested comments/notes."""
    notes: List[CommentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TaskPaginationResponse(BaseModel):
    items: List[TaskResponse]
    page: int
    limit: int
    total: int
    total_pages: int

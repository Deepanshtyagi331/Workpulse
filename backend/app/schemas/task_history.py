from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserSummary


class TaskHistoryResponse(BaseModel):
    id: int
    task_id: int
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    old_display: Optional[str] = None
    new_display: Optional[str] = None
    user: Optional[UserSummary] = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 101,
                "task_id": 42,
                "action": "status_changed",
                "field_name": "status",
                "old_value": "pending",
                "new_value": "in_progress",
                "old_display": "Pending",
                "new_display": "In Progress",
                "created_at": "2026-09-10T12:05:00Z",
                "user": {
                    "id": 1,
                    "name": "Deepansh Tyagi",
                    "email": "tyagideepansh26@gmail.com",
                    "role": "Lead Architect",
                    "app_role": "admin",
                },
            }
        },
    )


class TaskHistoryPaginationResponse(BaseModel):
    items: List[TaskHistoryResponse]
    page: int
    limit: int
    total: int
    total_pages: int

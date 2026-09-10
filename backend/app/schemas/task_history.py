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

    model_config = ConfigDict(from_attributes=True)


class TaskHistoryPaginationResponse(BaseModel):
    items: List[TaskHistoryResponse]
    page: int
    limit: int
    total: int
    total_pages: int

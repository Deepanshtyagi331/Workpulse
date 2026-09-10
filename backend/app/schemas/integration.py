from typing import List, Optional
from pydantic import BaseModel, Field


class ExternalTaskItem(BaseModel):
    """Normalized external task model mapped from upstream JSONPlaceholder todo."""
    external_id: int = Field(..., description="Unique identifier from upstream system")
    title: str = Field(..., description="Title of the task")
    completed: bool = Field(..., description="Whether task is marked as completed upstream")
    source: str = Field(default="JSONPlaceholder", description="Source external system name")


class ExternalTasksResponse(BaseModel):
    """Collection envelope for transformed external tasks."""
    source: str = Field(default="JSONPlaceholder", description="External provider name")
    count: int = Field(..., description="Total count of items in this response")
    items: List[ExternalTaskItem] = Field(default_factory=list, description="Transformed task items")


# Legacy schemas preserved for backward compatibility
class ExternalPost(BaseModel):
    id: int
    userId: int
    title: str
    body: str


class ExternalIntegrationResponse(BaseModel):
    provider: str
    endpoint: str
    status: str
    total_records: int
    sample_records: List[ExternalPost]


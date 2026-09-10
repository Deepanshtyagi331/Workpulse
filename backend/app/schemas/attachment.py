from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserSummary


class AttachmentResponse(BaseModel):
    id: int
    original_filename: str
    content_type: str
    file_size: int
    uploaded_by: Optional[UserSummary] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttachmentPaginationResponse(BaseModel):
    items: List[AttachmentResponse]
    page: int
    limit: int
    total: int
    total_pages: int

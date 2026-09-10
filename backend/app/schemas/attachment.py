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

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "original_filename": "architecture_diagram.pdf",
                "content_type": "application/pdf",
                "file_size": 204800,
                "created_at": "2026-09-10T12:00:00Z",
                "uploaded_by": {
                    "id": 1,
                    "name": "Deepansh Tyagi",
                    "email": "tyagideepansh26@gmail.com",
                    "role": "Lead Architect",
                    "app_role": "admin",
                },
            }
        },
    )


class AttachmentPaginationResponse(BaseModel):
    items: List[AttachmentResponse]
    page: int
    limit: int
    total: int
    total_pages: int

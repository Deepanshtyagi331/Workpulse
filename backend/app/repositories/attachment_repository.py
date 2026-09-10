from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models.attachment import Attachment
from app.repositories.base import BaseRepository


class AttachmentRepository(BaseRepository[Attachment]):
    def __init__(self, db: Session):
        super().__init__(Attachment, db)

    def get_by_id_with_uploader(self, attachment_id: int) -> Optional[Attachment]:
        return (
            self.db.query(Attachment)
            .options(joinedload(Attachment.uploader))
            .filter(Attachment.id == attachment_id)
            .first()
        )

    def list_for_task(
        self,
        task_id: int,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Attachment], int]:
        query = (
            self.db.query(Attachment)
            .options(joinedload(Attachment.uploader))
            .filter(Attachment.task_id == task_id)
        )
        total = query.count()
        offset = max(0, (page - 1) * limit)
        items = (
            query.order_by(Attachment.created_at.desc(), Attachment.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return items, total

    def list_all_for_task(self, task_id: int) -> List[Attachment]:
        return (
            self.db.query(Attachment)
            .filter(Attachment.task_id == task_id)
            .all()
        )

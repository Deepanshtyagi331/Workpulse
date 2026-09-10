from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models.note import Note
from app.repositories.base import BaseRepository


class NoteRepository(BaseRepository[Note]):
    def __init__(self, db: Session):
        super().__init__(Note, db)

    def get_by_id_with_relations(self, note_id: int) -> Optional[Note]:
        """Fetches a note with eager-loaded author information."""
        return (
            self.db.query(Note)
            .options(joinedload(Note.author))
            .filter(Note.id == note_id)
            .first()
        )

    def get_notes_by_task(
        self,
        task_id: int,
        page: int = 1,
        limit: int = 20,
        sort_order: str = "desc",
    ) -> Tuple[List[Note], int]:
        """
        Retrieves comments/notes for a specific task with database-level
        pagination and eager-loaded author metadata.
        """
        query = (
            self.db.query(Note)
            .options(joinedload(Note.author))
            .filter(Note.task_id == task_id)
        )

        total = query.count()

        if sort_order.lower().strip() == "asc":
            query = query.order_by(Note.created_at.asc())
        else:
            query = query.order_by(Note.created_at.desc())

        offset = max(0, (page - 1) * limit)
        items = query.offset(offset).limit(limit).all()

        return items, total

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models.task_history import TaskHistory
from app.repositories.base import BaseRepository


class TaskHistoryRepository(BaseRepository[TaskHistory]):
    def __init__(self, db: Session):
        super().__init__(TaskHistory, db)

    def create_entry(self, data: dict) -> TaskHistory:
        """Insert one history row without an extra commit (caller commits)."""
        entry = TaskHistory(**data)
        self.db.add(entry)
        self.db.flush()
        return entry

    def create_entries(self, rows: List[dict]) -> List[TaskHistory]:
        created = []
        for data in rows:
            created.append(self.create_entry(data))
        self.db.commit()
        for entry in created:
            self.db.refresh(entry)
        return created

    def get_by_task(
        self,
        task_id: int,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[TaskHistory], int]:
        query = (
            self.db.query(TaskHistory)
            .options(joinedload(TaskHistory.user))
            .filter(TaskHistory.task_id == task_id)
        )
        total = query.count()
        offset = max(0, (page - 1) * limit)
        items = (
            query.order_by(TaskHistory.created_at.desc(), TaskHistory.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return items, total

    def count_by_task(self, task_id: int) -> int:
        return self.db.query(TaskHistory).filter(TaskHistory.task_id == task_id).count()

    def nullify_user(self, user_id: int) -> None:
        self.db.query(TaskHistory).filter(TaskHistory.user_id == user_id).update(
            {TaskHistory.user_id: None},
            synchronize_session=False,
        )

from typing import Optional, List, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.task import Task
from app.models.user import User
from app.repositories.base import BaseRepository

ALLOWED_SORT_FIELDS = {
    "id": Task.id,
    "title": Task.title,
    "status": Task.status,
    "priority": Task.priority,
    "assigned_to": Task.assigned_to,
    "due_date": Task.due_date,
    "created_at": Task.created_at,
    "updated_at": Task.updated_at,
}


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: Session):
        super().__init__(Task, db)

    def get_by_id_with_relations(self, task_id: int) -> Optional[Task]:
        """Fetches a single task with eager-loaded assignee and notes."""
        return (
            self.db.query(Task)
            .options(
                joinedload(Task.assignee),
                selectinload(Task.notes),
            )
            .filter(Task.id == task_id)
            .first()
        )

    def get_filtered_tasks(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[int] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Task], int]:
        """
        Executes filtering, sorting, and pagination strictly at the database level.
        Avoids loading unpaginated datasets into application memory.
        """
        query = self.db.query(Task).options(joinedload(Task.assignee))

        # Search filter across title and description
        if search and search.strip():
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_pattern),
                    Task.description.ilike(search_pattern),
                )
            )

        # Status filter
        if status and status.strip():
            query = query.filter(Task.status == status.strip().lower())

        # Priority filter
        if priority and priority.strip():
            query = query.filter(Task.priority == priority.strip().lower())

        # Assignee filter
        if assignee is not None and assignee > 0:
            query = query.filter(Task.assigned_to == assignee)

        # Total count evaluated at database level
        total = query.count()

        # Sorting column and direction
        sort_column = ALLOWED_SORT_FIELDS.get(sort_by.lower().strip(), Task.created_at)
        if sort_order.lower().strip() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Database-level offset and limit pagination
        offset = max(0, (page - 1) * limit)
        items = query.offset(offset).limit(limit).all()

        return items, total

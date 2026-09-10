import math
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.task import Task
from app.models.task_history import HistoryAction
from app.models.user import User
from app.repositories.task_history_repository import TaskHistoryRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task_history import TaskHistoryResponse
from app.schemas.user import UserSummary

TRACKED_FIELDS = ("title", "description", "status", "priority", "assigned_to", "due_date")

FIELD_ACTION = {
    "status": HistoryAction.STATUS_CHANGED.value,
    "priority": HistoryAction.PRIORITY_CHANGED.value,
    "assigned_to": HistoryAction.ASSIGNEE_CHANGED.value,
}

STATUS_LABELS = {
    "pending": "Pending",
    "in_progress": "In Progress",
    "blocked": "Blocked",
    "completed": "Completed",
}

PRIORITY_LABELS = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "urgent": "Urgent",
}


def stringify_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def values_equal(field: str, old: Any, new: Any) -> bool:
    if old is None and new is None:
        return True
    if field == "due_date":
        old_s = stringify_value(old)
        new_s = stringify_value(new)
        return old_s == new_s
    if field == "assigned_to":
        try:
            old_n = int(old) if old is not None else None
            new_n = int(new) if new is not None else None
            return old_n == new_n
        except (TypeError, ValueError):
            return old == new
    return stringify_value(old) == stringify_value(new)


class TaskHistoryService:
    def __init__(self, db: Session):
        self.repo = TaskHistoryRepository(db)
        self.task_repo = TaskRepository(db)
        self.user_repo = UserRepository(db)

    def record_created(self, task: Task, actor: User) -> None:
        self.repo.create_entries(
            [
                {
                    "task_id": task.id,
                    "user_id": actor.id,
                    "action": HistoryAction.CREATED.value,
                    "field_name": None,
                    "old_value": None,
                    "new_value": task.title,
                }
            ]
        )

    def record_deleted(self, task: Task, actor: User) -> None:
        """
        Writes a deleted event before the task row is removed.
        CASCADE on task_id means this row is removed with the task so
        referential integrity is preserved. Deletion history is therefore
        not retained after the task is gone.
        """
        self.repo.create_entries(
            [
                {
                    "task_id": task.id,
                    "user_id": actor.id,
                    "action": HistoryAction.DELETED.value,
                    "field_name": None,
                    "old_value": task.title,
                    "new_value": None,
                }
            ]
        )

    def record_updates(self, task: Task, update_data: Dict[str, Any], actor: User) -> None:
        rows: List[dict] = []
        for field in TRACKED_FIELDS:
            if field not in update_data:
                continue
            new_value = update_data[field]
            old_value = getattr(task, field)
            if values_equal(field, old_value, new_value):
                continue
            rows.append(
                {
                    "task_id": task.id,
                    "user_id": actor.id,
                    "action": FIELD_ACTION.get(field, HistoryAction.UPDATED.value),
                    "field_name": field,
                    "old_value": stringify_value(old_value),
                    "new_value": stringify_value(new_value),
                }
            )
        if rows:
            self.repo.create_entries(rows)

    def get_history_for_task(
        self,
        task_id: int,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )

        items, total = self.repo.get_by_task(task_id=task_id, page=page, limit=limit)
        total_pages = math.ceil(total / limit) if total > 0 else 0

        return {
            "items": [self._to_response(entry) for entry in items],
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }

    def _display_value(self, field_name: Optional[str], raw: Optional[str]) -> Optional[str]:
        if raw is None:
            if field_name == "assigned_to":
                return "Unassigned"
            return None
        if field_name == "status":
            return STATUS_LABELS.get(raw, raw.replace("_", " ").title())
        if field_name == "priority":
            return PRIORITY_LABELS.get(raw, raw.title())
        if field_name == "assigned_to":
            try:
                user = self.user_repo.get_by_id(int(raw))
                return user.name if user else f"User #{raw}"
            except (TypeError, ValueError):
                return raw
        if field_name == "due_date":
            try:
                dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                return dt.strftime("%b %d, %Y")
            except (TypeError, ValueError):
                return raw
        if field_name == "description" and len(raw) > 140:
            return raw[:140].rstrip() + "…"
        return raw

    def _to_response(self, entry) -> TaskHistoryResponse:
        user_summary = None
        if entry.user is not None:
            user_summary = UserSummary.model_validate(entry.user)
        return TaskHistoryResponse(
            id=entry.id,
            task_id=entry.task_id,
            action=entry.action,
            field_name=entry.field_name,
            old_value=entry.old_value,
            new_value=entry.new_value,
            old_display=self._display_value(entry.field_name, entry.old_value),
            new_display=self._display_value(entry.field_name, entry.new_value),
            user=user_summary,
            created_at=entry.created_at,
        )

import math
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.task import Task
from app.models.user import User
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_history_service import TaskHistoryService
from app.services.attachment_service import AttachmentService
from app.websocket.manager import manager, create_ws_event


class TaskService:
    def __init__(self, db: Session):
        self.task_repo = TaskRepository(db)
        self.user_repo = UserRepository(db)
        self.history_service = TaskHistoryService(db)
        self.attachment_service = AttachmentService(db)

    def get_tasks(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[int] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Coordinates task filtering, sorting, and pagination logic.
        """
        # Normalize sort order
        sort_order_clean = "asc" if sort_order.lower().strip() == "asc" else "desc"

        items, total = self.task_repo.get_filtered_tasks(
            search=search,
            status=status,
            priority=priority,
            assignee=assignee,
            sort_by=sort_by,
            sort_order=sort_order_clean,
            page=page,
            limit=limit,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 0

        return {
            "items": items,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }

    def get_task_by_id(self, task_id: int) -> Task:
        """Retrieves task details or raises HTTP 404."""
        task = self.task_repo.get_by_id_with_relations(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )
        return task

    def create_task(self, task_in: TaskCreate, actor: User) -> Task:
        """Validates assignee existence, persists task, records history, and broadcasts event."""
        if task_in.assigned_to is not None:
            user = self.user_repo.get_by_id(task_in.assigned_to)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assigned user with ID {task_in.assigned_to} does not exist",
                )

        new_task = self.task_repo.create(task_in.model_dump())
        created = self.get_task_by_id(new_task.id)
        self.history_service.record_created(created, actor)

        # Broadcast task.created event
        task_data = TaskResponse.model_validate(created).model_dump(mode="json")
        event = create_ws_event(
            event_type="task.created",
            entity="task",
            action="created",
            entity_id=created.id,
            data=task_data,
            actor=actor,
        )
        manager.broadcast_sync(event)

        return created

    def update_task(self, task_id: int, task_in: TaskUpdate, actor: User) -> Task:
        """Updates task fields with validation, records history, and broadcasts event."""
        task = self.get_task_by_id(task_id)
        update_data = task_in.model_dump(exclude_unset=True)

        if "assigned_to" in update_data and update_data["assigned_to"] is not None:
            user = self.user_repo.get_by_id(update_data["assigned_to"])
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assigned user with ID {update_data['assigned_to']} does not exist",
                )

        # Determine primary event type based on updated fields
        old_status = task.status
        old_priority = task.priority
        old_assignee = task.assigned_to

        self.history_service.record_updates(task, update_data, actor)
        updated_task = self.task_repo.update(task, update_data)
        fresh_task = self.get_task_by_id(updated_task.id)

        # Broadcast specific event or generic task.updated
        task_data = TaskResponse.model_validate(fresh_task).model_dump(mode="json")
        event_type = "task.updated"
        action = "updated"
        if "status" in update_data and update_data["status"] != old_status:
            event_type = "task.status_changed"
            action = "status_changed"
        elif "priority" in update_data and update_data["priority"] != old_priority:
            event_type = "task.priority_changed"
            action = "priority_changed"
        elif "assigned_to" in update_data and update_data["assigned_to"] != old_assignee:
            event_type = "task.assignee_changed"
            action = "assignee_changed"

        event = create_ws_event(
            event_type=event_type,
            entity="task",
            action=action,
            entity_id=fresh_task.id,
            data=task_data,
            actor=actor,
        )
        manager.broadcast_sync(event)

        return fresh_task

    def delete_task(self, task_id: int, actor: User) -> TaskResponse:
        """Deletes task and cascaded child notes/history, and broadcasts task.deleted event."""
        task = self.get_task_by_id(task_id)
        response = TaskResponse.model_validate(task)
        self.attachment_service.delete_files_for_task(task.id)
        self.history_service.record_deleted(task, actor)
        self.task_repo.delete(task.id)

        # Broadcast task.deleted event
        event = create_ws_event(
            event_type="task.deleted",
            entity="task",
            action="deleted",
            entity_id=task_id,
            data={"id": task_id, "title": task.title},
            actor=actor,
        )
        manager.broadcast_sync(event)

        return response

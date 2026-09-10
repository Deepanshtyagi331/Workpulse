import math
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse


class TaskService:
    def __init__(self, db: Session):
        self.task_repo = TaskRepository(db)
        self.user_repo = UserRepository(db)

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

    def create_task(self, task_in: TaskCreate) -> Task:
        """Validates assignee existence and persists a new task."""
        if task_in.assigned_to is not None:
            user = self.user_repo.get_by_id(task_in.assigned_to)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assigned user with ID {task_in.assigned_to} does not exist",
                )

        new_task = self.task_repo.create(task_in.model_dump())
        return self.get_task_by_id(new_task.id)

    def update_task(self, task_id: int, task_in: TaskUpdate) -> Task:
        """Updates task fields with validation and returns the updated task."""
        task = self.get_task_by_id(task_id)
        update_data = task_in.model_dump(exclude_unset=True)

        if "assigned_to" in update_data and update_data["assigned_to"] is not None:
            user = self.user_repo.get_by_id(update_data["assigned_to"])
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assigned user with ID {update_data['assigned_to']} does not exist",
                )

        updated_task = self.task_repo.update(task, update_data)
        return self.get_task_by_id(updated_task.id)

    def delete_task(self, task_id: int) -> TaskResponse:
        """Deletes task and cascaded child notes, or raises HTTP 404."""
        task = self.get_task_by_id(task_id)
        response = TaskResponse.model_validate(task)
        self.task_repo.delete(task.id)
        return response

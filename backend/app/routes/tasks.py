from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskPaginationResponse,
)
from app.services.task_service import TaskService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


def get_task_service(db: Session = Depends(get_db)) -> TaskService:
    return TaskService(db)


@router.get(
    "",
    response_model=TaskPaginationResponse,
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=TaskPaginationResponse,
    summary="List & Filter Tasks",
    description=(
        "Retrieve tasks with database-level filtering, full-text search, "
        "sorting, and pagination metadata."
    ),
)
def list_tasks(
    search: Optional[str] = Query(
        None,
        description="Search substring in task title or description",
    ),
    status: Optional[str] = Query(
        None,
        description="Filter by task status: pending, in_progress, completed, blocked",
    ),
    priority: Optional[str] = Query(
        None,
        description="Filter by urgency: low, medium, high, urgent",
    ),
    assignee: Optional[int] = Query(
        None,
        ge=1,
        description="Filter by assigned user ID",
    ),
    sort_by: str = Query(
        "created_at",
        description="Field to sort by: created_at, due_date, priority, status, title",
    ),
    sort_order: str = Query(
        "desc",
        pattern="^(asc|desc|ASC|DESC)$",
        description="Sort direction: 'asc' or 'desc'",
    ),
    page: int = Query(
        1,
        ge=1,
        description="Page number (1-indexed)",
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="Max items per page",
    ),
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_tasks(
        search=search,
        status=status,
        priority=priority,
        assignee=assignee,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )


@router.get(
    "/{task_id}",
    response_model=TaskDetailResponse,
    summary="Get Task Details",
    description="Retrieve a specific task with assignee information and nested comments/notes.",
)
def get_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_task_by_id(task_id)


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Task",
    description="Create a new task with validation for title, status, priority, and assignee.",
)
def create_task(
    task_in: TaskCreate,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
):
    return service.create_task(task_in)


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update Task",
    description="Modify an existing task's attributes, status, or assignee.",
)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
):
    return service.update_task(task_id, task_in)


@router.delete(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Delete Task",
    description="Remove a task and cascade-delete all associated comments/notes.",
)
def delete_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
):
    return service.delete_task(task_id)

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status, BackgroundTasks
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
from app.services.background_service import background_job_service
from app.dependencies import get_current_user
from app.dependencies.rbac import require_admin_or_manager
from app.core.roles import UserAppRole
from app.models.user import User
from app.routes.task_history import router as history_router
from app.routes.attachments import task_attachments_router

router = APIRouter()
router.include_router(history_router)
router.include_router(task_attachments_router)


def get_task_service(db: Session = Depends(get_db)) -> TaskService:
    return TaskService(db)


# ---------------------------------------------------------------------------
# GET /tasks — All authenticated users may view tasks
# ---------------------------------------------------------------------------
@router.get("", response_model=TaskPaginationResponse, include_in_schema=False)
@router.get(
    "/",
    response_model=TaskPaginationResponse,
    summary="List & Filter Tasks",
    description="All authenticated users can view tasks. "
                "Employees see all tasks (full team visibility preserved). "
                "Admin/Manager can also filter by any assignee.",
)
def list_tasks(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee: Optional[int] = Query(None, ge=1),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc|ASC|DESC)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
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


# ---------------------------------------------------------------------------
# GET /tasks/{id} — All authenticated users
# ---------------------------------------------------------------------------
@router.get(
    "/{task_id}",
    response_model=TaskDetailResponse,
    summary="Get Task Details",
)
def get_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_task_by_id(task_id)


# ---------------------------------------------------------------------------
# POST /tasks — Admin or Manager only
# ---------------------------------------------------------------------------
@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Task",
    description="Admin/Manager only. Employees cannot create tasks.",
)
def create_task(
    task_in: TaskCreate,
    background_tasks: BackgroundTasks,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(require_admin_or_manager),
):
    result = service.create_task(task_in, actor=current_user)
    background_tasks.add_task(
        background_job_service.process_task_notification_job,
        event_type="TASK_CREATED",
        task_id=result.id,
        task_title=result.title,
        actor_id=current_user.id,
        actor_name=current_user.name,
        assigned_to_id=result.assigned_to,
    )
    return result


# ---------------------------------------------------------------------------
# PUT /tasks/{id} — Admin/Manager: any task. Employee: only their assigned task,
#                   and cannot reassign (change assigned_to).
# ---------------------------------------------------------------------------
@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update Task",
    description="Admin/Manager: full edit. Employee: only their assigned task, cannot reassign.",
)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    background_tasks: BackgroundTasks,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
):
    # Employees: enforce ownership + restrict reassignment
    if current_user.app_role == UserAppRole.EMPLOYEE:
        task = service.get_task_by_id(task_id)
        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only update tasks assigned to them.",
            )
        # Employees cannot change who a task is assigned to
        update_data = task_in.model_dump(exclude_unset=True)
        if "assigned_to" in update_data and update_data["assigned_to"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees cannot reassign tasks.",
            )

    result = service.update_task(task_id, task_in, actor=current_user)
    background_tasks.add_task(
        background_job_service.process_task_notification_job,
        event_type="TASK_UPDATED",
        task_id=result.id,
        task_title=result.title,
        actor_id=current_user.id,
        actor_name=current_user.name,
        assigned_to_id=result.assigned_to,
    )
    return result


# ---------------------------------------------------------------------------
# DELETE /tasks/{id} — Admin or Manager only
# ---------------------------------------------------------------------------
@router.delete(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Delete Task",
    description="Admin/Manager only. Employees cannot delete tasks.",
)
def delete_task(
    task_id: int,
    background_tasks: BackgroundTasks,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(require_admin_or_manager),
):
    result = service.delete_task(task_id, actor=current_user)
    background_tasks.add_task(
        background_job_service.process_task_notification_job,
        event_type="TASK_DELETED",
        task_id=task_id,
        task_title=result.title if hasattr(result, "title") else f"Task #{task_id}",
        actor_id=current_user.id,
        actor_name=current_user.name,
    )
    return result

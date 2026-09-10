from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.task_history import TaskHistoryPaginationResponse
from app.services.task_history_service import TaskHistoryService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


def get_history_service(db: Session = Depends(get_db)) -> TaskHistoryService:
    return TaskHistoryService(db)


@router.get(
    "/{task_id}/history",
    response_model=TaskHistoryPaginationResponse,
    summary="List Task History",
    description="Paginated audit log for a task. Actor is stored from JWT at write time; "
                "this endpoint is read-only. All authenticated users who can view tasks may read history.",
)
def list_task_history(
    task_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: TaskHistoryService = Depends(get_history_service),
):
    return service.get_history_for_task(task_id=task_id, page=page, limit=limit)

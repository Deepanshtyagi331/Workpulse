from fastapi import APIRouter, Depends, Query, Path, status
from app.schemas.integration import (
    ExternalTaskItem,
    ExternalTasksResponse,
    ExternalIntegrationResponse,
)
from app.services.external_api_service import ExternalApiService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


def get_external_api_service() -> ExternalApiService:
    return ExternalApiService()


@router.get(
    "/external-tasks",
    response_model=ExternalTasksResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch External Tasks (JSONPlaceholder)",
    description=(
        "Retrieves and transforms external tasks from JSONPlaceholder into WorkPulse format. "
        "Supports limiting the results between 1 and 50 items."
    ),
    include_in_schema=False,
)
@router.get(
    "/external-tasks/",
    response_model=ExternalTasksResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch External Tasks (JSONPlaceholder)",
    description=(
        "Retrieves and transforms external tasks from JSONPlaceholder into WorkPulse format. "
        "Supports limiting the results between 1 and 50 items."
    ),
)
async def get_external_tasks(
    limit: int = Query(
        10,
        ge=1,
        le=50,
        description="Maximum number of external tasks to fetch (must be between 1 and 50)",
    ),
    service: ExternalApiService = Depends(get_external_api_service),
    _current_user: User = Depends(get_current_user),
) -> ExternalTasksResponse:
    """Retrieves normalized external tasks from upstream JSONPlaceholder."""
    return await service.fetch_external_tasks(limit=limit)


@router.get(
    "/external-tasks/{external_id}",
    response_model=ExternalTaskItem,
    status_code=status.HTTP_200_OK,
    summary="Fetch Single External Task by ID",
    description="Fetches a single external task from JSONPlaceholder and transforms it into WorkPulse format.",
)
async def get_external_task_by_id(
    external_id: int = Path(..., ge=1, description="External task ID (must be >= 1)"),
    service: ExternalApiService = Depends(get_external_api_service),
    _current_user: User = Depends(get_current_user),
) -> ExternalTaskItem:
    """Retrieves a single normalized external task by its upstream ID."""
    return await service.fetch_external_task_by_id(external_id=external_id)


# Legacy endpoint preserved for backward compatibility
@router.get(
    "/sample-feed",
    response_model=ExternalIntegrationResponse,
    summary="Fetch External API Sample Data (Legacy)",
    description="Connects to upstream external provider to demonstrate integration capabilities.",
)
async def get_external_sample_feed(
    limit: int = Query(5, ge=1, le=20, description="Number of items to fetch"),
    service: ExternalApiService = Depends(get_external_api_service),
):
    return await service.fetch_sample_posts(limit=limit)


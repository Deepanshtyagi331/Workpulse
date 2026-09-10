from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import get_db
from app.schemas.stats import DashboardResponse
from app.services.dashboard_service import DashboardService
from app.dependencies import get_current_user
from app.models.user import User
from app.utilities.logger import logger

router = APIRouter()


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    """Dependency injection provider for DashboardService."""
    return DashboardService(db)


@router.get(
    "",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Dashboard Statistics",
    description=(
        "Retrieve aggregated dashboard metrics including total, status breakdowns, "
        "overdue tasks, and My Tasks for the authenticated user. "
        "Requires Bearer token."
    ),
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Dashboard Statistics",
    description=(
        "Retrieve aggregated dashboard metrics including total, status breakdowns, "
        "overdue tasks, and My Tasks for the authenticated user. "
        "Requires Bearer token."
    ),
)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    """
    Main dashboard controller. Uses authenticated user identity from JWT.
    """
    try:
        return service.get_dashboard_data(user_id=current_user.id)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        logger.error(f"Database error in get_dashboard: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard statistics due to a database error.",
        )
    except Exception as exc:
        logger.error(f"Unexpected error in get_dashboard: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating dashboard metrics.",
        )

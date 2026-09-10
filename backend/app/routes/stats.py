from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.stats import DashboardStatsResponse
from app.services.stats_service import StatsService

router = APIRouter()


def get_stats_service(db: Session = Depends(get_db)) -> StatsService:
    return StatsService(db)


@router.get(
    "",
    response_model=DashboardStatsResponse,
    summary="Get Dashboard Statistics",
    description="Retrieve operational high-level statistics and summaries for the dashboard.",
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=DashboardStatsResponse,
    summary="Get Dashboard Statistics",
    description="Retrieve operational high-level statistics and summaries for the dashboard.",
)
def get_dashboard_stats(
    service: StatsService = Depends(get_stats_service),
):
    return service.get_dashboard_stats()


from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.schemas.stats import DashboardStatsResponse, MetricCard


class StatsService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def get_dashboard_stats(self) -> DashboardStatsResponse:
        total_users = self.user_repo.count()
        active_users = self.user_repo.count_active()
        distribution = self.user_repo.get_department_distribution()
        departments_count = len(distribution)

        metrics = [
            MetricCard(
                title="Total Users",
                value=str(total_users),
                change="+12% from last month",
                is_positive=True,
                icon="Users",
            ),
            MetricCard(
                title="Active Members",
                value=str(active_users),
                change="+5% active rate",
                is_positive=True,
                icon="UserCheck",
            ),
            MetricCard(
                title="Departments",
                value=str(departments_count if departments_count > 0 else 0),
                change="Stable",
                is_positive=True,
                icon="Building2",
            ),
            MetricCard(
                title="System Status",
                value="Operational",
                change="99.9% uptime",
                is_positive=True,
                icon="Activity",
            ),
        ]

        recent_activity = [
            {
                "id": 1,
                "title": "System Initialized",
                "description": "WorkPulse architecture scaffolded successfully",
                "timestamp": "Just now",
                "type": "system",
            },
            {
                "id": 2,
                "title": "Database Connected",
                "description": "SQLite ORM engine active and configured",
                "timestamp": "5m ago",
                "type": "database",
            },
            {
                "id": 3,
                "title": "API Gateway Ready",
                "description": "FastAPI routes & Swagger documentation online",
                "timestamp": "10m ago",
                "type": "network",
            },
        ]

        return DashboardStatsResponse(
            total_users=total_users,
            active_users=active_users,
            departments_count=departments_count,
            system_status="Operational",
            metrics=metrics,
            department_distribution=distribution,
            recent_activity=recent_activity,
        )

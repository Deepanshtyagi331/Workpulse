from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.dashboard_repository import DashboardRepository
from app.repositories.user_repository import UserRepository
from app.schemas.stats import DashboardResponse, MetricCard


class DashboardService:
    def __init__(self, db: Session):
        self.dashboard_repo = DashboardRepository(db)
        self.user_repo = UserRepository(db)

    def get_dashboard_data(self, user_id: Optional[int] = None) -> DashboardResponse:
        """
        Coordinates dashboard statistics retrieval.
        Validates optional user_id existence or raises HTTP 404.
        """
        # Validate user existence if contextual user_id is passed
        current_user_name = None
        if user_id is not None:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with ID {user_id} not found",
                )
            current_user_name = user.name

        # Execute database-level aggregations
        task_metrics = self.dashboard_repo.get_task_metrics(user_id=user_id)
        priority_dist = self.dashboard_repo.get_priority_distribution()
        user_metrics = self.dashboard_repo.get_user_metrics()

        # Build metric cards
        metrics = [
            MetricCard(
                title="Total Tasks",
                value=str(task_metrics["total_tasks"]),
                change=f"{task_metrics['completed_tasks']} completed",
                is_positive=True,
                icon="CheckSquare",
            ),
            MetricCard(
                title="In Progress",
                value=str(task_metrics["in_progress_tasks"]),
                change="Active workflows",
                is_positive=True,
                icon="Clock",
            ),
            MetricCard(
                title="Blocked Tasks",
                value=str(task_metrics["blocked_tasks"]),
                change="Requires intervention" if task_metrics["blocked_tasks"] > 0 else "No blockers",
                is_positive=task_metrics["blocked_tasks"] == 0,
                icon="AlertOctagon",
            ),
            MetricCard(
                title="Overdue Tasks",
                value=str(task_metrics["overdue_tasks"]),
                change="Past due target" if task_metrics["overdue_tasks"] > 0 else "All on schedule",
                is_positive=task_metrics["overdue_tasks"] == 0,
                icon="AlertTriangle",
            ),
        ]

        if user_id is not None:
            metrics.append(
                MetricCard(
                    title="My Assigned Tasks",
                    value=str(task_metrics["my_tasks"]),
                    change=f"Assigned to {current_user_name}",
                    is_positive=True,
                    icon="UserCheck",
                )
            )

        recent_activity = [
            {
                "id": 1,
                "title": "Task System Active",
                "description": f"{task_metrics['total_tasks']} tasks synchronized across departments",
                "timestamp": "Real-time",
                "type": "tasks",
            },
            {
                "id": 2,
                "title": "Database Engine",
                "description": "SQLAlchemy aggregate views active with zero in-memory overhead",
                "timestamp": "Active",
                "type": "database",
            },
            {
                "id": 3,
                "title": "Directory Health",
                "description": f"{user_metrics['active_users']} active team members across {user_metrics['departments_count']} departments",
                "timestamp": "Verified",
                "type": "users",
            },
        ]

        return DashboardResponse(
            total_tasks=task_metrics["total_tasks"],
            pending_tasks=task_metrics["pending_tasks"],
            in_progress_tasks=task_metrics["in_progress_tasks"],
            completed_tasks=task_metrics["completed_tasks"],
            blocked_tasks=task_metrics["blocked_tasks"],
            overdue_tasks=task_metrics["overdue_tasks"],
            my_tasks=task_metrics["my_tasks"],
            user_id=user_id,
            total_users=user_metrics["total_users"],
            active_users=user_metrics["active_users"],
            departments_count=user_metrics["departments_count"],
            system_status="Operational",
            priority_distribution=priority_dist,
            department_distribution=user_metrics["department_distribution"],
            metrics=metrics,
            recent_activity=recent_activity,
        )

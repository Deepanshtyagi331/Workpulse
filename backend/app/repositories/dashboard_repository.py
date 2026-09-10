from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.models.task import Task, TaskStatus
from app.models.user import User


class DashboardRepository:
    """
    Encapsulates all database-level aggregation queries for the dashboard.
    Executes counting and condition filtering in the database rather than Python memory.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_task_metrics(self, user_id: Optional[int] = None) -> Dict[str, int]:
        """
        Retrieves task totals, status breakdowns, and overdue counts in a single SQL query.
        Overdue logic: due_date IS NOT NULL AND due_date < NOW() AND status != 'completed'.
        """
        now = datetime.utcnow()

        aggregates_query = self.db.query(
            func.count(Task.id).label("total_tasks"),
            func.count(case((Task.status == TaskStatus.PENDING.value, 1))).label("pending_tasks"),
            func.count(case((Task.status == TaskStatus.IN_PROGRESS.value, 1))).label("in_progress_tasks"),
            func.count(case((Task.status == TaskStatus.COMPLETED.value, 1))).label("completed_tasks"),
            func.count(case((Task.status == TaskStatus.BLOCKED.value, 1))).label("blocked_tasks"),
            func.count(
                case(
                    (
                        (Task.due_date.isnot(None))
                        & (Task.due_date < now)
                        & (Task.status != TaskStatus.COMPLETED.value),
                        1,
                    )
                )
            ).label("overdue_tasks"),
        )

        row = aggregates_query.first()

        my_tasks = 0
        if user_id is not None:
            my_tasks = (
                self.db.query(func.count(Task.id))
                .filter(Task.assigned_to == user_id)
                .scalar()
                or 0
            )

        return {
            "total_tasks": row.total_tasks if row else 0,
            "pending_tasks": row.pending_tasks if row else 0,
            "in_progress_tasks": row.in_progress_tasks if row else 0,
            "completed_tasks": row.completed_tasks if row else 0,
            "blocked_tasks": row.blocked_tasks if row else 0,
            "overdue_tasks": row.overdue_tasks if row else 0,
            "my_tasks": my_tasks,
        }

    def get_priority_distribution(self) -> Dict[str, int]:
        """Aggregates task count grouped by priority at the database level."""
        results = (
            self.db.query(Task.priority, func.count(Task.id))
            .group_by(Task.priority)
            .all()
        )
        return {p: count for p, count in results}

    def get_user_metrics(self) -> Dict[str, Any]:
        """Aggregates user metrics and department distribution."""
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        active_users = (
            self.db.query(func.count(User.id))
            .filter(User.is_active.is_(True))
            .scalar()
            or 0
        )
        dept_results = (
            self.db.query(User.department, func.count(User.id))
            .group_by(User.department)
            .all()
        )
        dept_distribution = {dept: count for dept, count in dept_results}

        return {
            "total_users": total_users,
            "active_users": active_users,
            "departments_count": len(dept_distribution),
            "department_distribution": dept_distribution,
        }

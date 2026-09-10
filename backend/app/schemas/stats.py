from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class MetricCard(BaseModel):
    title: str = Field(..., description="Label of the metric")
    value: str = Field(..., description="Display value")
    change: str = Field(..., description="Period-over-period trend description")
    is_positive: bool = Field(default=True, description="Positive or negative sentiment")
    icon: str = Field(default="Activity", description="Lucide icon identifier")


class TaskStatsSummary(BaseModel):
    total: int = Field(default=0, description="Total number of tasks")
    completed: int = Field(default=0, description="Completed task count")
    in_progress: int = Field(default=0, description="In-progress task count")
    blocked: int = Field(default=0, description="Blocked task count")
    pending: int = Field(default=0, description="Pending task count")
    overdue: int = Field(default=0, description="Overdue task count")
    by_priority: Dict[str, int] = Field(default_factory=dict, description="Task count broken down by priority")


class DashboardResponse(BaseModel):
    """Primary schema for /api/dashboard matching assignment requirements."""
    total_tasks: int = Field(..., description="Total tasks count")
    pending_tasks: int = Field(..., description="Tasks in pending state")
    in_progress_tasks: int = Field(..., description="Tasks in progress")
    completed_tasks: int = Field(..., description="Tasks successfully completed")
    blocked_tasks: int = Field(..., description="Tasks currently blocked")
    overdue_tasks: int = Field(..., description="Tasks past due date and not completed")
    my_tasks: int = Field(default=0, description="Tasks assigned to current user context")
    user_id: Optional[int] = Field(None, description="Contextual user ID (temporary auth parameter)")
    total_users: int = Field(default=0, description="Total registered team members")
    active_users: int = Field(default=0, description="Active team members")
    departments_count: int = Field(default=0, description="Unique active departments")
    system_status: str = Field(default="Operational", description="System operational health string")
    priority_distribution: Dict[str, int] = Field(default_factory=dict, description="Tasks grouped by priority")
    department_distribution: Dict[str, int] = Field(default_factory=dict, description="Users grouped by department")
    metrics: List[MetricCard] = Field(default_factory=list, description="Top-level stat cards")
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list, description="Recent system and task events")


class DashboardStatsResponse(BaseModel):
    """Backward-compatible response schema for existing /api/stats endpoint."""
    total_users: int = Field(..., description="Total registered users")
    active_users: int = Field(..., description="Active user count")
    departments_count: int = Field(..., description="Total unique active departments")
    system_status: str = Field(default="Operational", description="System operational health string")
    task_summary: Optional[TaskStatsSummary] = Field(None, description="Detailed task distribution metrics")
    metrics: List[MetricCard] = Field(default_factory=list, description="Top-level stat cards")
    department_distribution: Dict[str, int] = Field(default_factory=dict, description="Users grouped by department")
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list, description="Recent audit/activity stream")

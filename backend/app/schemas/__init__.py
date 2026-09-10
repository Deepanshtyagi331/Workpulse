from app.schemas.common import APIResponse, PaginatedResponse, HealthResponse
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserSummary,
    UserPaginationResponse,
)
from app.schemas.task import (
    TaskBase,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskPaginationResponse,
)
from app.schemas.comment import (
    CommentBase,
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentPaginationResponse,
)
from app.schemas.stats import (
    MetricCard,
    TaskStatsSummary,
    DashboardResponse,
    DashboardStatsResponse,
)
from app.schemas.integration import (
    ExternalTaskItem,
    ExternalTasksResponse,
    ExternalPost,
    ExternalIntegrationResponse,
)

__all__ = [
    # Common
    "APIResponse",
    "PaginatedResponse",
    "HealthResponse",
    # Users
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserSummary",
    "UserPaginationResponse",
    # Tasks
    "TaskBase",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "TaskDetailResponse",
    "TaskPaginationResponse",
    # Comments / Notes
    "CommentBase",
    "CommentCreate",
    "CommentUpdate",
    "CommentResponse",
    "CommentPaginationResponse",
    # Stats
    "MetricCard",
    "TaskStatsSummary",
    "DashboardResponse",
    "DashboardStatsResponse",
    # Integrations
    "ExternalTaskItem",
    "ExternalTasksResponse",
    "ExternalPost",
    "ExternalIntegrationResponse",
]


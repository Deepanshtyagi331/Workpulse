from fastapi import APIRouter
from app.routes import health, users, tasks, comments, stats, dashboard, integrations

api_router = APIRouter()

api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(users.router, prefix="/users", tags=["Users Management"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Task Management"])
api_router.include_router(comments.router, tags=["Comments / Notes"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Statistics"])
api_router.include_router(stats.router, prefix="/stats", tags=["Dashboard Statistics"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["External Integrations"])


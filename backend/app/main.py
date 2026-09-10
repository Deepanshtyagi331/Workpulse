from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer

from app.core.config import settings
from app.database.session import Base, engine
import app.models  # Ensures all SQLAlchemy models are registered
from app.routes.api import api_router
from app.routes.users import router as users_router
from app.routes.tasks import router as tasks_router
from app.routes.comments import router as comments_router
from app.routes.dashboard import router as dashboard_router
from app.routes.stats import router as stats_router
from app.routes.integrations import router as integrations_router
from app.routes.attachments import router as attachments_router
from app.routes.auth import router as auth_router
from app.utilities.logger import logger




@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Initializes database tables on startup.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    # Create SQLite database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully.")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    description=(
        f"**{settings.PROJECT_TAGLINE}**\n\n"
        "WorkPulse is a high-performance, modular internal dashboard API for task "
        "tracking, user management, operational metrics, and external integrations.\n\n"
        "**Authentication**: Most endpoints require a Bearer JWT token obtained from "
        "`POST /api/auth/login`. Click **Authorize** and enter `Bearer <your_token>`."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Authentication", "description": "Register, login, current user, and logout."},
        {"name": "System Health", "description": "Endpoints to check server and database status."},
        {"name": "Users Management", "description": "Operations to manage internal team members."},
        {"name": "Task Management", "description": "Operations to create, filter, sort, update, and manage tasks."},
        {"name": "Comments / Notes", "description": "Operations to manage comments and notes on tasks."},
        {"name": "Task History", "description": "Audit log of task create, update, and delete events."},
        {"name": "Attachments", "description": "Upload, list, download, and delete task file attachments."},
        {"name": "Dashboard Statistics", "description": "Aggregated metrics, charts, and activity feeds."},
        {"name": "External Integrations", "description": "Upstream third-party integration pipelines."},
        {"name": "WebSockets", "description": "Real-time bidirectional WebSocket events for tasks, comments, and attachments."},
    ],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=f"{settings.PROJECT_NAME} API",
        version=settings.VERSION,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
    )
    schema.setdefault("components", {})
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token in the format: Bearer <token>",
        }
    }
    schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Request logging middleware."""
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Completed {request.method} {request.url.path} with status {response.status_code}")
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Fallback handler for uncaught server exceptions."""
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal server error occurred.",
            "detail": str(exc) if settings.DEBUG else "Please contact administrator.",
        },
    )


# ─── Auth routes (public — no token required for register/login) ─────────────
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"], include_in_schema=False)

# ─── Register API v1 routes ───────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)

# ─── Direct /api alias routes ─────────────────────────────────────────────────
app.include_router(users_router, prefix="/api/users", tags=["Users Management"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Task Management"])
app.include_router(attachments_router, prefix="/api/attachments", tags=["Attachments"])
app.include_router(comments_router, prefix="/api", tags=["Comments / Notes"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard Statistics"])
app.include_router(stats_router, prefix="/api/stats", tags=["Dashboard Statistics"])
app.include_router(integrations_router, prefix="/api/integrations", tags=["External Integrations"])

from app.routes.websocket import router as websocket_router
app.include_router(websocket_router, prefix="/api", tags=["WebSockets"])
app.include_router(websocket_router, prefix=settings.API_V1_STR, tags=["WebSockets"], include_in_schema=False)

from app.routes.health import router as health_router
app.include_router(health_router, prefix="/api", tags=["System Health"])
app.include_router(health_router, tags=["System Health"], include_in_schema=False)

@app.get("/", tags=["Root"])
def root_info():
    """Root info endpoint providing service metadata."""
    return {
        "app": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "auth": "/api/auth",
    }

# WorkPulse

## Internal Task & Management Dashboard

WorkPulse is a full-stack internal task and management dashboard designed to help teams manage tasks, users, assignments, progress, comments, attachments, audit history, and real-time collaboration through a modern role-based interface. Built with a FastAPI backend and a React (Vite) single-page frontend, WorkPulse provides enterprise-grade authentication, role-based access control (RBAC), drag-and-drop Kanban workflow boards, live WebSocket event synchronization, persistent SQLite storage, and containerized deployment with Docker Compose.

---

## Key Features

### Authentication & Authorization
* **JWT Authentication**: Secure token-based session handling with cryptographic signing (HS256) and configurable token expiration.
* **User Registration & Login**: Validated credential intake with email normalization and real-time validation.
* **Protected Routes**: Granular route guards on both frontend navigation and backend API endpoints.
* **Password Security**: Cryptographic password hashing using `passlib[bcrypt]`.
* **Session Termination**: Instant client-side logout clearing tokens, context state, and terminating WebSocket connections.

### Role-Based Access Control (RBAC)
* **Admin**: Complete system-wide administrative control. Manages all tasks, users (creation, updates, deletion, role assignment), comments, attachments, and views full team metrics.
* **Manager**: Oversees department operations. Creates, edits, and deletes any team tasks; provisions Employee accounts; updates non-admin user profiles; uploads/removes task attachments; views team audit trails and dashboard analytics.
* **Employee**: Focused on individual execution. Views team tasks; updates assigned tasks (status, notes, priority); cannot reassign tasks; cannot delete tasks or provision users; adds comments and uploads attachments to assigned tasks.

### Task Management
* **CRUD Lifecycle**: Create, inspect, update, and soft/hard delete tasks with strict validation.
* **Metadata Fields**: Title, description, status, priority, assignee, due date, tags, and timestamps.
* **Search & Filters**: Debounced full-text search across titles and descriptions; multi-criteria filtering by status, priority, and assigned team member.
* **Sorting & Pagination**: Column sorting by creation date, due date, and priority with server-side pagination.

### Executive Dashboard
* **Real-Time KPIs**: Total task count, completed tasks, in-progress velocity, blocked bottlenecks, and overdue items.
* **Priority Distribution**: Visual breakdown of Low, Medium, High, and Urgent task loads.
* **Team Velocity**: Interactive overview of recent updates, team members, and completion ratios.

### Interactive Kanban Board
* **Visual Workflow Columns**: Distinct lanes for `Pending`, `In Progress`, `Blocked`, and `Completed`.
* **Drag-and-Drop Interaction**: Accessible, accessible drag-and-drop powered by `@dnd-kit`.
* **Role-Aware Movement**: Immediate client-side reordering with backend permission verification and automatic optimistic rollback on rejection.

### Collaboration & Comments
* **Task Discussion Threads**: Chronological comments and operational notes on individual tasks.
* **Author Attribution**: Automated author binding extracted directly from authenticated JWT tokens.
* **Permission Constraints**: Authors can edit or delete their own comments; Administrators can moderate any comment.

### Audit History & Compliance
* **Automated Event Tracking**: Records task creation, status transitions, priority updates, assignee changes, and general edits.
* **Complete Audit Details**: Captures the exact actor, UTC timestamp, field mutated, previous value, and new value.
* **Immutable Logs**: Audit entries are append-only and visible to all authorized project collaborators.

### File Attachments
* **Task File Associations**: Upload and link documents, specifications, and images directly to tasks.
* **File Validation**: MIME-type allowlist (`image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`, `application/zip`) and magic-byte header inspection.
* **Size Enforcement**: 10 MB per-file upload ceiling.
* **Storage Isolation**: Path-traversal sanitization with UUID-based stored filenames preserving original filenames in metadata.
* **Persistence**: Persisted across Docker container restarts via named volumes.

### Real-Time Updates (WebSockets)
* **FastAPI WebSockets**: Native bidirectional event broadcasting engine.
* **Streamed Events**: Live pushes for task creations, status updates, deletions, new comments, and file attachments.
* **Connection Lifecycle**: Real-time connection badge (Connected / Reconnecting / Offline) with exponential backoff auto-reconnect.
* **REST Fallback**: Graceful degradation to REST API queries if WebSocket connectivity is interrupted.

### Light & Dark Theme
* **Modern Aesthetic**: High-contrast, zero-flash dark and light mode system built with Tailwind CSS variables.
* **Preference Persistence**: Automatic persistence to `localStorage` and respect for system `prefers-color-scheme`.

### Docker Containerization
* **Frontend Container**: Multi-stage build (Node.js 20 build stage -> Nginx Alpine production image).
* **Backend Container**: Multi-stage build (Python 3.11-slim runtime with non-root security user `appuser`).
* **Reverse Proxy**: Nginx routes frontend assets, proxies `/api/*` to FastAPI, and upgrades `/api/ws` WebSocket connections.
* **Persistent Volumes**: Named volumes for SQLite database (`backend-data`) and file uploads (`backend-uploads`).

### API Documentation
* **Interactive Swagger UI**: Available at `/docs` with interactive Bearer JWT authorization.
* **ReDoc Specification**: Clean documentation available at `/redoc`.
* **OpenAPI 3.1 Schema**: Raw JSON schema available at `/openapi.json`.

### Automated Testing
* **Backend**: Comprehensive Pytest suite (63 passed tests, 87% test coverage) covering authentication, RBAC, CRUD, WebSocket events, and background jobs.
* **Frontend**: Native Node.js test runner verifying utilities, date formatters, and theme persistence.

### Background Jobs
* **FastAPI BackgroundTasks**: Asynchronous in-process post-processing jobs executed after HTTP responses.
* **Operational Telemetry**: Notification routing, attachment storage verification, and comment activity logging.

---

## Technology Stack

### Frontend
| Technology | Version | Description |
| :--- | :--- | :--- |
| **React** | 18.3.1 | Core user interface component library |
| **Vite** | 5.4.14 | Next-generation frontend build tool and dev server |
| **Tailwind CSS** | 3.4.17 | Utility-first styling engine with CSS custom properties |
| **React Router** | 7.18.3 | Client-side routing and protected route architecture |
| **Axios** | 1.7.9 | Promise-based HTTP client with auth interceptors |
| **@dnd-kit/core** | 6.3.1 | Lightweight, accessible drag-and-drop primitives |
| **Lucide React** | 0.475.0 | Clean and consistent icon library |

### Backend
| Technology | Version | Description |
| :--- | :--- | :--- |
| **Python** | 3.9+ (3.11 in Docker) | High-performance backend runtime |
| **FastAPI** | 0.110.0+ | Modern async web framework with automatic OpenAPI |
| **Uvicorn** | 0.28.0+ | ASGI web server implementation |
| **Pydantic** | 2.6.4+ | Data validation and settings management |
| **SQLAlchemy** | 2.0.28+ | Python SQL toolkit and Object Relational Mapper |
| **SQLite** | 3.x | Lightweight relational database with zero setup |
| **python-jose** | 3.3.0+ | Cryptographic JSON Web Token (JWT) signing and validation |
| **passlib + bcrypt** | 1.7.4+ | Secure password hashing algorithms |
| **python-multipart** | 0.0.9+ | Streaming multipart form and file upload parser |

### Infrastructure & Deployment
| Technology | Description |
| :--- | :--- |
| **Docker** | Containerization platform isolating frontend and backend environments |
| **Docker Compose** | Multi-container orchestration specifying networks and volume persistence |
| **Nginx** | Reverse proxy, static asset server, and WebSocket upgrade handler |

### Testing Frameworks
| Technology | Scope | Description |
| :--- | :--- | :--- |
| **Pytest** | Backend | Unit and integration test runner (63 tests) |
| **pytest-cov** | Backend | Code coverage analysis and branch reporting (87% coverage) |
| **AnyIO / Starlette** | Backend | Async test client simulating concurrent API requests |
| **Node.js Test Runner** | Frontend | Built-in test runner (`node:test`, `node:assert`) |

---

## Architecture

```text
                    ┌─────────────────────────────────────────┐
                    │                 Browser                 │
                    │   (React 18 SPA + Dark/Light Themes)    │
                    └────────────────────┬────────────────────┘
                                         │
                        HTTP / REST      │      WebSocket (/api/ws)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │               Nginx Proxy               │
                    │    Static Assets + Reverse Proxy (:80)  │
                    └────────────────────┬────────────────────┘
                                         │
                         Internal Network Routing (:8000)
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │             FastAPI Backend             │
                    │  ├── JWT Authentication & RBAC Guards   │
                    │  ├── Task & Dashboard Services          │
                    │  ├── File Attachment & Validation       │
                    │  ├── In-Memory WebSocket Manager        │
                    │  └── Background Tasks Post-Processing   │
                    └──────────────┬──────────────────┬───────┘
                                   │                  │
                                   ▼                  ▼
                    ┌─────────────────────────┐ ┌─────────────────────────┐
                    │     SQLite Database     │ │   File Upload Storage   │
                    │  (Volume: backend-data) │ │(Volume: backend-uploads)│
                    │      workpulse.db       │ │      /app/uploads       │
                    └─────────────────────────┘ └─────────────────────────┘
```

---

## Project Structure

```text
Workpulse/
├── backend/
│   ├── app/
│   │   ├── core/                  # Configuration, security, JWT, roles
│   │   ├── database/              # SQLAlchemy engine, session, Base
│   │   ├── dependencies/          # Auth guards and RBAC role dependencies
│   │   ├── models/                # Database models (User, Task, Note, Attachment, History)
│   │   ├── repositories/          # Data access layer
│   │   ├── routes/                # FastAPI endpoint routers (auth, tasks, comments, etc.)
│   │   ├── schemas/               # Pydantic request/response schemas with examples
│   │   ├── services/              # Business logic and background services
│   │   ├── utilities/             # Helper functions and validators
│   │   ├── websocket/             # Centralized WebSocket ConnectionManager
│   │   └── main.py                # FastAPI application entry point & CORS configuration
│   ├── tests/                     # 63 automated tests for auth, RBAC, tasks, files, etc.
│   ├── uploads/                   # Local file storage (contains .gitkeep)
│   ├── .dockerignore
│   ├── Dockerfile                 # Multi-stage Python 3.11-slim container
│   ├── pytest.ini                 # Pytest configuration
│   ├── requirements.txt           # Python dependencies
│   └── seed.py                    # Database seeder with realistic test data
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components (Kanban, modals, badges, etc.)
│   │   ├── constants/             # Application constants and configuration
│   │   ├── context/               # React Contexts (AuthContext, ThemeContext, WebSocketContext)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── pages/                 # Route pages (Dashboard, Tasks, Kanban, Users, etc.)
│   │   ├── services/              # Axios API service clients
│   │   ├── utils/                 # Formatting helpers and local storage wrappers
│   │   ├── App.jsx                # Main route configuration and navigation layout
│   │   └── main.jsx               # React entry point
│   ├── .dockerignore
│   ├── Dockerfile                 # Multi-stage Node 20 builder + Nginx Alpine runner
│   ├── nginx.conf                 # Nginx proxy and WebSocket upgrade configuration
│   ├── package.json               # Frontend dependencies and test script
│   └── vite.config.js             # Vite build configuration
│
├── docker-compose.yml             # Container orchestration and volume bindings
├── .env.example                   # Template environment configuration
├── .gitignore                     # Git exclusion rules
└── README.md                      # Project documentation
```

---

## Prerequisites

Before running WorkPulse, ensure your host environment meets the following requirements:

### For Docker Deployment (Recommended)
* **Docker Engine**: Version `20.10.0` or higher
* **Docker Compose**: Version `2.0.0` or higher

### For Local Manual Development
* **Python**: Version `3.9` or higher (3.11 recommended)
* **Node.js**: Version `18.0.0` or higher (Node 20+ recommended)
* **npm**: Version `9.0.0` or higher

---

## Environment Configuration

WorkPulse uses environment variables for configuration. A template file [`.env.example`](file:///.env.example) is provided in the repository root.

### 1. Create Local Environment File
```bash
cp .env.example .env
```

### 2. Configuration Parameters

| Variable | Description | Default / Recommended |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Display name of the application | `"WorkPulse"` |
| `PROJECT_TAGLINE` | Subtitle used in API metadata | `"Internal Task & Management Dashboard"` |
| `VERSION` | Application release version | `"0.1.0"` |
| `DEBUG` | Enables verbose debug mode | `False` |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:////app/data/workpulse.db` (Docker) or `sqlite:///./workpulse.db` (Local) |
| `ALLOWED_ORIGINS` | Permitted CORS origins (comma-separated) | `http://localhost,http://localhost:80,http://localhost:5173` |
| `JWT_SECRET_KEY` | Cryptographic secret for signing JWTs | Replace with a secure 256-bit random hex string |
| `JWT_ALGORITHM` | JWT cryptographic signing algorithm | `"HS256"` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime before expiration | `480` (8 hours) |
| `MAX_UPLOAD_SIZE_MB` | Maximum permitted file upload size | `10` |
| `UPLOAD_DIR` | Filesystem storage path for attachments | `"/app/uploads"` (Docker) or `"./uploads"` (Local) |

> [!NOTE]
> To generate a secure random secret key for `JWT_SECRET_KEY`, run:
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```

---

## Docker Setup (Evaluator Recommended)

The easiest way to evaluate WorkPulse is using Docker Compose. This starts both the frontend and backend services along with an Nginx reverse proxy and persistent storage.

### 1. Build & Start the Application
```bash
docker compose up --build
```
Or run in detached mode:
```bash
docker compose up -d --build
```

### 2. Application Access URLs
* **Web Application**: [http://localhost](http://localhost)
* **Backend API Root**: [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **OpenAPI 3.1 JSON Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
* **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. Monitoring & Inspection
Inspect container status:
```bash
docker compose ps
```

Stream live application logs:
```bash
docker compose logs -f
```

### 4. Stopping Containers
To cleanly stop all running services:
```bash
docker compose down
```

> [!IMPORTANT]
> Do **NOT** use `docker compose down -v` unless you intentionally want to wipe all persistent database records and uploaded file attachments.

---

## Local Development Setup

If you prefer to run the frontend and backend directly on your machine without Docker:

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample data
python seed.py

# Start the development server with auto-reload
uvicorn app.main:app --reload --port 8000
```
The backend will be available at [http://localhost:8000](http://localhost:8000).

### 2. Frontend Setup

In a separate terminal window:

```bash
cd frontend

# Install node dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend will be available at [http://localhost:5173](http://localhost:5173).

---

## Demo Accounts & Credentials

The database comes pre-seeded with realistic team accounts across all three supported roles. Each account has been verified and is ready for immediate evaluation:

| Role | Name | Email | Password | Scope & Primary Use |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Sarah Chen | `sarah.chen@workpulse.internal` | `WorkPulse2024!` | Full system administration, user management, and moderation |
| **Admin** | Deepansh Tyagi | `tyagideepansh26@gmail.com` | `WorkPulse2024!` | Primary project owner admin account |
| **Manager** | Alex Rivera | `alex.rivera@workpulse.internal` | `WorkPulse2024!` | Team oversight, task assignment, employee creation, analytics |
| **Manager** | Priya Patel | `priya.patel@workpulse.internal` | `WorkPulse2024!` | Product management, task scheduling, and department monitoring |
| **Employee** | Elena Rostova | `elena.rostova@workpulse.internal` | `WorkPulse2024!` | Execution, status transitions, comments, and attachments |
| **Employee** | Marcus Vance | `marcus.vance@workpulse.internal` | `WorkPulse2024!` | Design lead, task progress updates, and task notes |

> [!TIP]
> Evaluators can also register a brand new account using the **Register** link on the login page. New self-registered accounts default safely to the `employee` role.

---

## Role-Based Permissions Matrix

WorkPulse strictly enforces RBAC across both the API layer and the user interface:

| System Capability | Admin | Manager | Employee | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **View All Tasks** | ✓ | ✓ | ✓ | Global read permissions for team transparency |
| **Create Tasks** | ✓ | ✓ | ✗ | Enforced via `require_admin_or_manager` dependency (HTTP 403) |
| **Edit Any Task** | ✓ | ✓ | ✗ | Admin & Manager can edit all tasks and reassign owners |
| **Edit Assigned Tasks** | ✓ | ✓ | ✓ | Employees can update status/notes; cannot reassign owner |
| **Delete Tasks** | ✓ | ✓ | ✗ | Enforced via `require_admin_or_manager` dependency (HTTP 403) |
| **Move Kanban Cards** | ✓ | ✓ | Assigned | Dragging non-assigned tasks as Employee reverts automatically |
| **View Audit History** | ✓ | ✓ | ✓ | Read-only access to immutable change logs |
| **Upload Attachments** | ✓ | ✓ | Assigned | Allowed on any task for Admin/Manager; assigned tasks only for Employee |
| **Download Attachments** | ✓ | ✓ | ✓ | All authenticated team members can view project assets |
| **Delete Attachments** | ✓ | ✓ | Own/Assigned | Admin/Manager can remove any; Employee only own files on assigned tasks |
| **Create Comments** | ✓ | ✓ | ✓ | Binds comment author directly to authenticated JWT subject |
| **Edit Comments** | Any | Own Only | Own Only | Admin can moderate any; non-admins restricted to own comments |
| **Delete Comments** | Any | Own Only | Own Only | Admin can moderate any; non-admins restricted to own comments |
| **Create User Accounts** | All Roles | Employees Only | ✗ | Managers can provision employee accounts; cannot create Admins |
| **Delete User Accounts** | ✓ | ✗ | ✗ | Restrictive `require_admin` dependency (HTTP 403) |
| **View Team Dashboard** | ✓ | ✓ | ✓ | Aggregate team metrics and priority breakdown |

---

## API Documentation

FastAPI provides comprehensive, interactive OpenAPI specifications out of the box:

* **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)  
  *Supports interactive testing. Click the **Authorize** button and input `Bearer <your_token>` to test protected endpoints.*
* **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **OpenAPI 3.1 JSON**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### Major API Endpoint Groups

| Group | Route Prefix | Primary Operations |
| :--- | :--- | :--- |
| **Authentication** | `/api/auth` | User registration, login token generation, user profile, logout |
| **Task Management** | `/api/tasks` | Task CRUD, status updates, priority sorting, search, pagination |
| **Task History** | `/api/tasks/{id}/history` | Paginated audit trail showing field-level mutations and actors |
| **Attachments** | `/api/tasks/{id}/attachments` | Upload, list, secure download, and deletion of files |
| **Comments / Notes** | `/api/tasks/{id}/notes`, `/api/comments` | Task discussion thread creation, editing, and deletion |
| **Users Management** | `/api/users` | Directory retrieval, user profile updates, employee provisioning |
| **Dashboard Statistics** | `/api/dashboard`, `/api/stats` | Aggregated counts, completion ratios, priority distribution |
| **External Integrations**| `/api/integrations` | External API pipeline connectors and synthetic data sync |
| **System Health** | `/api/health` | Service uptime, database connectivity, and environment status |
| **WebSockets** | `/api/ws`, `/api/v1/ws` | Bidirectional real-time event distribution stream |

---

## Automated Testing

### 1. Backend Test Suite (Pytest)
The backend test suite executes against an isolated temporary SQLite database and upload directory:

```bash
cd backend
source .venv/bin/activate
pytest -q
```
To run with detailed coverage analysis:
```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```

**Verified Test Results**:
* **63 passed test cases** (in `backend/tests/`)
* **87% total backend code coverage**
* Test coverage spans:
  * `test_auth.py`: Registration, token issuance, expiry handling, password verification
  * `test_rbac.py`: Role hierarchies, 403 Forbidden enforcement on tasks and users
  * `test_tasks.py`: Task lifecycle, search, pagination, and sorting
  * `test_comments.py`: Comment creation, ownership validation, and admin moderation
  * `test_attachments.py`: MIME validation, magic-byte checking, size limits, downloads, deletion
  * `test_history.py`: Automatic audit logging of status, priority, and assignment changes
  * `test_dashboard.py`: Statistics calculation and priority breakdowns
  * `test_background_jobs.py`: Asynchronous notification dispatch and storage audits
  * `test_websocket.py`: Connection lifecycle, authentication params, and broadcasting

### 2. Frontend Test Suite
The frontend includes unit tests using Node.js's native test runner:

```bash
cd frontend
npm test
```

**Verified Test Results**:
* **8 passed unit test cases**
* Validates date calculations, string truncation, file size formatters, and dark/light `localStorage` theme persistence.

### 3. Production Build Validation
```bash
cd frontend
npm run build
```
Generates an optimized production bundle with zero compilation errors.

---

## Docker Testing & Verification

To verify the Docker orchestration configuration:

```bash
# 1. Validate Docker Compose syntax
docker compose config

# 2. Build images from Dockerfiles
docker compose build

# 3. Start containers in background
docker compose up -d

# 4. Check running status and health
docker compose ps

# 5. Check logs for clean initialization
docker compose logs backend
docker compose logs frontend
```

---

## Real-Time Updates (WebSockets)

WorkPulse implements a real-time event pipeline using native FastAPI WebSockets:

* **Authentication**: Clients authenticate by passing their JWT via query parameter (`ws://localhost:8000/api/ws?token=<jwt>`).
* **Connection Lifecycle**:
  * Visual status indicator in the top navigation bar displays connection state:
    * 🟢 **Connected**: Active real-time event subscription.
    * 🟡 **Reconnecting**: Interrupted socket; performing automatic exponential backoff retry.
    * 🔴 **Offline**: Connection closed; frontend gracefully falls back to standard REST fetching.
* **Broadcast Events**:
  * `TASK_CREATED`: Injects new tasks into list and Kanban views without manual refresh.
  * `TASK_UPDATED`: Reflects title, priority, or field changes across open sessions.
  * `TASK_STATUS_CHANGED`: Smoothly shifts cards between Kanban columns.
  * `TASK_DELETED`: Removes cards from active boards and lists.
  * `COMMENT_ADDED`: Live-updates discussion threads in task detail modals.
  * `ATTACHMENT_ADDED`: Appends newly uploaded files in real time.
* **Nginx Reverse Proxying**: The Nginx configuration automatically handles `Upgrade $http_upgrade` and `Connection "upgrade"` headers for WebSocket endpoints.
* **Architecture Note**:
  > The current WebSocket connection manager uses an in-memory registry designed for a single backend instance. Horizontal multi-instance scaling would require a shared Pub/Sub message broker such as Redis.

---

## Background Jobs Architecture

WorkPulse includes non-blocking in-process background job processing via FastAPI's native `BackgroundTasks`:

* **Execution Model**: Jobs are queued and executed asynchronously in the background *after* the client HTTP response has been sent, ensuring zero latency impact on REST responses.
* **No Heavy External Infrastructure**: Functions cleanly within the application process without requiring Redis, Celery, or RabbitMQ.
* **Fault Tolerance**: Background tasks are wrapped in isolated `try-except` blocks with error logging. If a background job fails, the user's primary database transaction and HTTP response remain completely unaffected.
* **Implemented Job Handlers** (`backend/app/services/background_service.py`):
  1. `process_task_notification_job`: Triggered by task creation, status transitions, and priority escalation; formats and logs asynchronous notification telemetry.
  2. `process_attachment_audit_job`: Triggered on file uploads and removals; validates storage consistency and logs storage audit metrics.
  3. `process_comment_telemetry_job`: Triggered on comment addition, updating, or moderation; logs operational telemetry.
* **Verification**: Verified via dedicated unit and integration tests in `backend/tests/test_background_jobs.py`.

---

## Security Architecture

WorkPulse follows industry best practices for application and container security:

* **Cryptographic Password Hashing**: Passwords are never stored in plaintext; hashed using `bcrypt` with adaptive work factor via `passlib`.
* **JWT Access Tokens**: Cryptographically signed using `HS256` with strict expiration checks.
* **Fine-Grained RBAC**: Centralized FastAPI dependencies (`require_admin`, `require_admin_or_manager`) enforce strict authorization before controllers execute.
* **Attachment Security**:
  * Multi-layer validation checking both declared MIME type and file extension.
  * Magic-byte file header validation preventing disguised executable payloads.
  * Strict 10 MB file size limit enforced prior to writing to disk.
  * Safe UUID filenames on disk (`uuid4().hex`) preventing path traversal attacks (`../`).
* **Non-Root Docker Execution**: The backend container runs as an unprivileged user (`appuser:appuser`, UID 10001) rather than root.
* **Secure Defaults**: No sensitive keys, JWT secrets, or production passwords are committed to the repository.

---

## Project Status

WorkPulse is a full-stack internal task management dashboard featuring:

- JWT authentication
- Role-based access control (Admin, Manager, Employee)
- Comprehensive task management with filters, sorting, search, and pagination
- Interactive drag-and-drop Kanban board
- Complete audit history tracking
- Secure file attachments with validation and persistence
- Real-time WebSocket synchronization with REST fallback
- Zero-flash dark and light mode themes
- Production-ready Docker containerization with Nginx
- 63-test automated testing suite with 87% backend coverage
- Interactive OpenAPI / Swagger documentation
- Non-blocking background job processing

---
*Developed for internal team productivity, transparency, and operational velocity.*
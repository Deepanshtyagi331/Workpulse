#!/usr/bin/env python3
"""
Seed script for WorkPulse database.
Populates realistic users, tasks, and notes/comments with diverse statuses, priorities,
and due dates (overdue, upcoming, and completed).

Development credentials for all seeded users:
  Password: WorkPulse2024!
"""

from datetime import datetime, timedelta
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import Base, engine, SessionLocal
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.note import Note
from app.core.security import hash_password

# Development seed password — NOT a production credential
SEED_PASSWORD = "WorkPulse2024!"


def seed_database():
    print("🌱 Initializing WorkPulse database schema...")
    # Recreate tables to ensure clean, consistent seed state
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✓ Tables verified and ready.")

    db = SessionLocal()
    try:
        now = datetime.utcnow()

        # -------------------------------------------------------------------------
        # 1. Seed Users (7 realistic team members across departments)
        # -------------------------------------------------------------------------
        users_data = [
            {
                "name": "Sarah Chen",
                "email": "sarah.chen@workpulse.internal",
                "department": "Engineering",
                "role": "Lead Architect",
                "is_active": True,
            },
            {
                "name": "Alex Rivera",
                "email": "alex.rivera@workpulse.internal",
                "department": "Engineering",
                "role": "Senior Backend Engineer",
                "is_active": True,
            },
            {
                "name": "Priya Patel",
                "email": "priya.patel@workpulse.internal",
                "department": "Product",
                "role": "Senior Product Manager",
                "is_active": True,
            },
            {
                "name": "Marcus Vance",
                "email": "marcus.vance@workpulse.internal",
                "department": "Design",
                "role": "Staff UI/UX Designer",
                "is_active": True,
            },
            {
                "name": "Elena Rostova",
                "email": "elena.rostova@workpulse.internal",
                "department": "Operations",
                "role": "DevOps Lead",
                "is_active": True,
            },
            {
                "name": "David Kim",
                "email": "david.kim@workpulse.internal",
                "department": "Quality Assurance",
                "role": "QA Automation Lead",
                "is_active": True,
            },
            {
                "name": "Rachel Adams",
                "email": "rachel.adams@workpulse.internal",
                "department": "Security",
                "role": "InfoSec Analyst",
                "is_active": True,
            },
        ]

        user_objects = {}
        hashed_pw = hash_password(SEED_PASSWORD)
        for u in users_data:
            user = User(**u, password_hash=hashed_pw)
            db.add(user)
            db.flush()
            user_objects[u["name"]] = user

        print(f"✓ Seeded {len(user_objects)} team members (all with hashed password).") 

        # -------------------------------------------------------------------------
        # 2. Seed Tasks (22 realistic, diverse operational tasks)
        # -------------------------------------------------------------------------
        tasks_data = [
            # Blocked & Overdue
            {
                "title": "Fix payment gateway integration",
                "description": "Stripe webhook signature validation fails intermittently on checkout callback under concurrent traffic.",
                "status": TaskStatus.BLOCKED.value,
                "priority": TaskPriority.URGENT.value,
                "assigned_to": user_objects["Alex Rivera"].id,
                "due_date": now - timedelta(days=2),
            },
            # In Progress & Upcoming
            {
                "title": "Update company landing page",
                "description": "Incorporate new Q3 branding guidelines, updated typography, and responsive hero illustrations.",
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["Marcus Vance"].id,
                "due_date": now + timedelta(days=5),
            },
            # In Progress & Upcoming
            {
                "title": "Prepare monthly analytics report",
                "description": "Aggregate DAU/MAU cohorts, retention metrics, and churn indicators for executive quarterly review.",
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.HIGH.value,
                "assigned_to": user_objects["Priya Patel"].id,
                "due_date": now + timedelta(days=2),
            },
            # Completed & Past
            {
                "title": "Review customer feedback",
                "description": "Analyze ZenDesk tickets and categorized NPS survey responses from latest enterprise beta rollout.",
                "status": TaskStatus.COMPLETED.value,
                "priority": TaskPriority.LOW.value,
                "assigned_to": user_objects["Priya Patel"].id,
                "due_date": now - timedelta(days=7),
            },
            # Completed & Past
            {
                "title": "Deploy production release v1.4.0",
                "description": "Roll out multi-tenant database connection pooling and blue-green background worker updates.",
                "status": TaskStatus.COMPLETED.value,
                "priority": TaskPriority.URGENT.value,
                "assigned_to": user_objects["Elena Rostova"].id,
                "due_date": now - timedelta(days=3),
            },
            # In Progress & Upcoming
            {
                "title": "Optimize database queries",
                "description": "Add composite indexes on dashboard audit events and rewrite slow aggregations across reporting views.",
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.HIGH.value,
                "assigned_to": user_objects["Alex Rivera"].id,
                "due_date": now + timedelta(days=4),
            },
            # Pending & Upcoming
            {
                "title": "Audit JWT authentication token expiration",
                "description": "Evaluate refresh token rotation semantics and establish RFC-compliant revocation blacklist mechanism.",
                "status": TaskStatus.PENDING.value,
                "priority": TaskPriority.HIGH.value,
                "assigned_to": user_objects["Rachel Adams"].id,
                "due_date": now + timedelta(days=8),
            },
            # Pending & Upcoming
            {
                "title": "Implement rate limiting on public endpoints",
                "description": "Configure sliding-window rate limiters using Redis token buckets across all unauthenticated endpoints.",
                "status": TaskStatus.PENDING.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["Alex Rivera"].id,
                "due_date": now + timedelta(days=12),
            },
            # Completed & Past
            {
                "title": "Configure automated daily database backups",
                "description": "Set up encrypted S3 bucket lifecycle replication and verify automated point-in-time recovery test.",
                "status": TaskStatus.COMPLETED.value,
                "priority": TaskPriority.HIGH.value,
                "assigned_to": user_objects["Elena Rostova"].id,
                "due_date": now - timedelta(days=10),
            },
            # Blocked & Overdue
            {
                "title": "Refactor user permissions middleware",
                "description": "Blocked waiting for final IAM role taxonomy and capability matrix signoff from compliance.",
                "status": TaskStatus.BLOCKED.value,
                "priority": TaskPriority.HIGH.value,
                "assigned_to": user_objects["Sarah Chen"].id,
                "due_date": now - timedelta(days=1),
            },
            # In Progress & Upcoming
            {
                "title": "Design onboarding walkthrough modals",
                "description": "Create high-fidelity Figma prototypes for new user orientation and step-by-step product tour.",
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["Marcus Vance"].id,
                "due_date": now + timedelta(days=6),
            },
            # Blocked & Overdue
            {
                "title": "Investigate memory spike during CSV exports",
                "description": "Worker containers run out of memory when generating compressed ledger reports exceeding 100,000 records.",
                "status": TaskStatus.BLOCKED.value,
                "priority": TaskPriority.URGENT.value,
                "assigned_to": user_objects["Sarah Chen"].id,
                "due_date": now - timedelta(days=3),
            },
            # Completed & Past
            {
                "title": "Upgrade frontend dependencies and React packages",
                "description": "Bump Vite to latest stable, audit npm packages, and verify CSS tree-shaking.",
                "status": TaskStatus.COMPLETED.value,
                "priority": TaskPriority.LOW.value,
                "assigned_to": user_objects["Marcus Vance"].id,
                "due_date": now - timedelta(days=4),
            },
            # Pending & Upcoming
            {
                "title": "Set up Datadog APM distributed tracing",
                "description": "Instrument FastAPI request lifecycles and propagate W3C trace headers through upstream microservices.",
                "status": TaskStatus.PENDING.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["Elena Rostova"].id,
                "due_date": now + timedelta(days=14),
            },
            # In Progress & Upcoming
            {
                "title": "Revamp notification delivery queue",
                "description": "Transition email and webhook dispatching from synchronous calls to asynchronous background worker queues.",
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["Alex Rivera"].id,
                "due_date": now + timedelta(days=7),
            },
            # Completed & Past
            {
                "title": "Conduct quarterly security vulnerability scan",
                "description": "Execute automated SAST and DAST penetration testing; zero critical CVEs discovered.",
                "status": TaskStatus.COMPLETED.value,
                "priority": TaskPriority.HIGH.value,
                "assigned_to": user_objects["Rachel Adams"].id,
                "due_date": now - timedelta(days=8),
            },
            # Pending & Upcoming (Unassigned demo)
            {
                "title": "Migrate static assets to CDN edge distribution",
                "description": "Route public images, scripts, and font bundles through Cloudflare edge caching zones with brotli compression.",
                "status": TaskStatus.PENDING.value,
                "priority": TaskPriority.LOW.value,
                "assigned_to": None,
                "due_date": now + timedelta(days=18),
            },
            # Pending & Upcoming
            {
                "title": "Draft API specification for third-party partners",
                "description": "Compile OpenAPI 3.1 documentation and postman collection for external B2B integration partners.",
                "status": TaskStatus.PENDING.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["Priya Patel"].id,
                "due_date": now + timedelta(days=15),
            },
            # In Progress & Upcoming
            {
                "title": "Resolve WebSocket reconnection drops in dashboard",
                "description": "Implement exponential backoff reconnect logic with heartbeat ping interval monitoring for live dashboard.",
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.HIGH.value,
                "assigned_to": user_objects["Sarah Chen"].id,
                "due_date": now + timedelta(days=3),
            },
            # Pending & Upcoming
            {
                "title": "Create automated end-to-end smoke test suite",
                "description": "Build Playwright test suites covering core authentication, user provisioning, and task updates.",
                "status": TaskStatus.PENDING.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["David Kim"].id,
                "due_date": now + timedelta(days=10),
            },
            # Blocked & Overdue
            {
                "title": "Benchmark API response times under simulated load",
                "description": "Blocked pending staging environment provisioning and synthetic load runner configuration.",
                "status": TaskStatus.BLOCKED.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["David Kim"].id,
                "due_date": now - timedelta(days=4),
            },
            # Completed & Past
            {
                "title": "Establish incident response runbook",
                "description": "Document severity tiers, on-call escalation policies, and post-mortem review templates.",
                "status": TaskStatus.COMPLETED.value,
                "priority": TaskPriority.MEDIUM.value,
                "assigned_to": user_objects["Rachel Adams"].id,
                "due_date": now - timedelta(days=12),
            },
        ]

        task_objects = []
        for t in tasks_data:
            task = Task(**t)
            db.add(task)
            db.flush()
            task_objects.append(task)

        print(f"✓ Seeded {len(task_objects)} tasks with various statuses, priorities, and dates.")

        # -------------------------------------------------------------------------
        # 3. Seed Comments / Notes for several tasks
        # -------------------------------------------------------------------------
        notes_data = [
            # Notes on Task 1 ("Fix payment gateway integration")
            {
                "task_id": task_objects[0].id,
                "user_id": user_objects["Alex Rivera"].id,
                "content": "Replicated the issue in sandbox. Stripe returns HTTP 400 with 'Signature verification failed' when payload contains multi-byte UTF-8 characters.",
            },
            {
                "task_id": task_objects[0].id,
                "user_id": user_objects["Sarah Chen"].id,
                "content": "Investigated our raw body parser. It looks like the request body was parsed as JSON before HMAC validation. We must preserve raw byte stream.",
            },
            # Notes on Task 2 ("Update company landing page")
            {
                "task_id": task_objects[1].id,
                "user_id": user_objects["Marcus Vance"].id,
                "content": "Uploaded revised Figma comps for desktop and mobile hero viewports. Waiting for product copy review.",
            },
            {
                "task_id": task_objects[1].id,
                "user_id": user_objects["Priya Patel"].id,
                "content": "Value proposition copy approved! Great pacing on the value pillars.",
            },
            # Notes on Task 6 ("Optimize database queries")
            {
                "task_id": task_objects[5].id,
                "user_id": user_objects["Alex Rivera"].id,
                "content": "EXPLAIN QUERY PLAN showed full table scans on audit_events. Adding composite index (user_id, created_at) reduced latency from 320ms to 8ms.",
            },
            # Notes on Task 10 ("Refactor user permissions middleware")
            {
                "task_id": task_objects[9].id,
                "user_id": user_objects["Sarah Chen"].id,
                "content": "Waiting for Rachel to finalize the IAM role spec before locking down permission matrix.",
            },
            {
                "task_id": task_objects[9].id,
                "user_id": user_objects["Rachel Adams"].id,
                "content": "IAM spec completed and shared on internal docs. Unblocking this today!",
            },
            # Notes on Task 12 ("Investigate memory spike during CSV exports")
            {
                "task_id": task_objects[11].id,
                "user_id": user_objects["Sarah Chen"].id,
                "content": "Heapdump confirms entire query result set is buffered into RAM. Need to refactor to streaming generator using server-side cursors.",
            },
            # Notes on Task 21 ("Benchmark API response times")
            {
                "task_id": task_objects[20].id,
                "user_id": user_objects["David Kim"].id,
                "content": "Locust test scripts written. Waiting for staging cluster capacity to spin up 500 virtual users.",
            },
        ]

        for n in notes_data:
            note = Note(**n)
            db.add(note)

        db.commit()
        print(f"✓ Seeded {len(notes_data)} comments/notes across multiple tasks.")

        # -------------------------------------------------------------------------
        # Summary Report
        # -------------------------------------------------------------------------
        user_count = db.query(User).count()
        task_count = db.query(Task).count()
        note_count = db.query(Note).count()
        completed_count = db.query(Task).filter(Task.status == TaskStatus.COMPLETED.value).count()
        blocked_count = db.query(Task).filter(Task.status == TaskStatus.BLOCKED.value).count()
        in_progress_count = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS.value).count()
        pending_count = db.query(Task).filter(Task.status == TaskStatus.PENDING.value).count()
        overdue_count = db.query(Task).filter(Task.due_date < now, Task.status != TaskStatus.COMPLETED.value).count()

        print("\n" + "=" * 50)
        print("🎉 Database successfully seeded!")
        print("=" * 50)
        print(f"Users:        {user_count}")
        print(f"Tasks:        {task_count}")
        print(f"  - Completed:   {completed_count}")
        print(f"  - In Progress: {in_progress_count}")
        print(f"  - Blocked:     {blocked_count}")
        print(f"  - Pending:     {pending_count}")
        print(f"  - Overdue:     {overdue_count}")
        print(f"Notes/Comments: {note_count}")
        print("=" * 50 + "\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

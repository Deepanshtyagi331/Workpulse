"""
WorkPulse Application Roles

Defines the three RBAC application roles used for authorization.
These are separate from the user's job `role` field (which is a free-text
organizational title like "Lead Architect").

`app_role` governs what API operations a user is permitted to perform.
"""

from enum import Enum


class UserAppRole(str, Enum):
    """Application-level authorization roles."""
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


# Convenience sets for multi-role checks
ADMIN_ONLY = {UserAppRole.ADMIN}
ADMIN_OR_MANAGER = {UserAppRole.ADMIN, UserAppRole.MANAGER}
ALL_ROLES = {UserAppRole.ADMIN, UserAppRole.MANAGER, UserAppRole.EMPLOYEE}

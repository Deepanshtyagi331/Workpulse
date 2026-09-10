"""
RBAC Authorization Dependencies

Reusable FastAPI dependencies that enforce role-based access control.

Flow:
  JWT → get_current_user (authenticated User) → require_roles() → 403 or pass-through

Usage:
    @router.post("/users/", dependencies=[Depends(require_admin_or_manager)])
    def create_user(...): ...

    # Or inline for access to the user object:
    @router.delete("/users/{id}")
    def delete_user(..., _: User = Depends(require_admin)): ...
"""

from typing import Set
from fastapi import Depends, HTTPException, status

from app.core.roles import UserAppRole
from app.dependencies import get_current_user
from app.models.user import User


def require_roles(*allowed_roles: UserAppRole):
    """
    Factory that returns a FastAPI dependency enforcing one of the given roles.

    Returns the authenticated user if authorized, raises HTTP 403 otherwise.
    Note: Authentication (401) is handled upstream by get_current_user.
    """
    allowed: Set[str] = {r.value for r in allowed_roles}

    def _dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.app_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation.",
            )
        return current_user

    return _dependency


# Pre-built convenience dependencies
require_admin = require_roles(UserAppRole.ADMIN)
require_admin_or_manager = require_roles(UserAppRole.ADMIN, UserAppRole.MANAGER)
require_any_role = require_roles(UserAppRole.ADMIN, UserAppRole.MANAGER, UserAppRole.EMPLOYEE)

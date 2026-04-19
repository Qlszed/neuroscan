from functools import wraps
from typing import List, Callable
from fastapi import Depends, HTTPException, status
from app.models.models import UserRole
from app.api.auth import get_current_user
from app.models.models import User


class Permissions:
    ADMIN = "admin"
    PSYCHOLOGIST = "psychologist"
    CURATOR = "curator"
    USER = "user"

    ROLE_HIERARCHY = {
        UserRole.ADMIN: 4,
        UserRole.PSYCHOLOGIST: 3,
        UserRole.CURATOR: 2,
        UserRole.USER: 1,
    }

    ROLE_PERMISSIONS = {
        UserRole.ADMIN: [
            "system:manage", "users:read", "users:write", "users:delete",
            "logs:read", "analysis:read_all", "analysis:read_own",
            "analysis:run", "profiles:manage", "roles:assign",
        ],
        UserRole.PSYCHOLOGIST: [
            "analysis:read_assigned", "analysis:read_own", "analysis:run",
            "profiles:read_assigned", "users:read_assigned",
        ],
        UserRole.CURATOR: [
            "analysis:read_group_summary", "analysis:read_own",
            "profiles:read_group_summary",
        ],
        UserRole.USER: [
            "analysis:read_own", "analysis:run", "profiles:manage_own",
            "consent:manage",
        ],
    }

    @classmethod
    def has_permission(cls, role: UserRole, permission: str) -> bool:
        return permission in cls.ROLE_PERMISSIONS.get(role, [])


def require_role(*allowed_roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' does not have access to this resource"
            )
        return current_user
    return role_checker


def require_permission(permission: str):
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not Permissions.has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return permission_checker


admin_only = require_role(UserRole.ADMIN)
psychologist_or_above = require_role(UserRole.ADMIN, UserRole.PSYCHOLOGIST)
curator_or_above = require_role(UserRole.ADMIN, UserRole.PSYCHOLOGIST, UserRole.CURATOR)
any_authenticated = require_role(UserRole.ADMIN, UserRole.PSYCHOLOGIST, UserRole.CURATOR, UserRole.USER)

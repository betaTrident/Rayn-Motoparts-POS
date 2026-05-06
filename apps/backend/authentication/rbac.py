from __future__ import annotations

from django.contrib.auth.models import Group

from .models import Permission, Role, RolePermission, User


SYSTEM_ROLES = {"superadmin", "admin", "staff"}
STAFF_ROLE = "staff"
ADMIN_ROLE = "admin"
SUPERADMIN_ROLE = "superadmin"


def get_user_role_name(user: User | None) -> str | None:
    if user is None or not getattr(user, "is_authenticated", False):
        return None

    if user.is_superuser:
        return SUPERADMIN_ROLE

    role = getattr(user, "role", None)
    if role and role.is_active:
        return role.name

    group_name = (
        user.groups.filter(name__in=SYSTEM_ROLES)
        .order_by("name")
        .values_list("name", flat=True)
        .first()
    )
    return group_name


def sync_user_group_for_role(user: User) -> None:
    role_name = get_user_role_name(user)
    if not role_name:
        return

    group, _ = Group.objects.get_or_create(name=role_name)
    for stale_group in user.groups.filter(name__in=SYSTEM_ROLES).exclude(name=role_name):
        user.groups.remove(stale_group)
    user.groups.add(group)


def get_effective_permission_keys(user: User | None) -> list[str]:
    role_name = get_user_role_name(user)
    if not role_name:
        return []

    permission_qs = Permission.objects.filter(
        role_permissions__role__name=role_name,
        role_permissions__role__is_active=True,
    ).order_by("module", "action")

    return [f"{permission.module}:{permission.action}" for permission in permission_qs]


def user_has_permission(user: User | None, permission_key: str) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    if user.is_superuser:
        return True
    return permission_key in get_effective_permission_keys(user)


def user_is_superadmin(user: User | None) -> bool:
    return get_user_role_name(user) == SUPERADMIN_ROLE


def user_is_admin(user: User | None) -> bool:
    return get_user_role_name(user) == ADMIN_ROLE


def get_manageable_role_names(actor: User) -> set[str]:
    if user_is_superadmin(actor):
        return {ADMIN_ROLE, STAFF_ROLE}
    if user_is_admin(actor):
        return {STAFF_ROLE}
    return set()


def can_manage_target_user(actor: User, target: User) -> bool:
    if actor.id == target.id:
        return False
    target_role = get_user_role_name(target)
    return target_role in get_manageable_role_names(actor)


def role_permissions_payload(role: Role) -> list[str]:
    permissions = Permission.objects.filter(role_permissions__role=role).order_by(
        "module",
        "action",
    )
    return [f"{permission.module}:{permission.action}" for permission in permissions]


def replace_role_permissions(role: Role, permission_keys: list[str]) -> None:
    parsed_keys = []
    for key in permission_keys:
        if ":" not in key:
            continue
        module, action = key.split(":", 1)
        parsed_keys.append((module, action))

    permissions = list(Permission.objects.filter(module__in=[key[0] for key in parsed_keys]))
    permissions_by_key = {(permission.module, permission.action): permission for permission in permissions}
    selected = [
        permissions_by_key[key]
        for key in parsed_keys
        if key in permissions_by_key
    ]

    RolePermission.objects.filter(role=role).delete()
    RolePermission.objects.bulk_create(
        [RolePermission(role=role, permission=permission) for permission in selected],
        ignore_conflicts=True,
    )

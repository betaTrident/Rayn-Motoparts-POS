from django.core.management.base import BaseCommand
from django.db import transaction

from authentication.models import Permission, Role, RolePermission


ROLE_DEFINITIONS = [
    ("superadmin", "Developer - unrestricted system access"),
    ("admin", "Store manager - full operations"),
    ("staff", "Cashier/Staff - POS and operational access"),
]

PERMISSION_DEFINITIONS = [
    ("products", "read", "View products"),
    ("products", "write", "Create and edit products"),
    ("products", "delete", "Delete products"),
    ("products", "pricing", "Manage product pricing"),
    ("inventory", "read", "View inventory"),
    ("inventory", "adjust", "Adjust inventory quantities"),
    ("pos", "sell", "Process sales"),
    ("pos", "void", "Void transactions"),
    ("returns", "create", "Create sales returns"),
    ("returns", "approve", "Approve returns"),
    ("receipts", "read", "View receipts"),
    ("receipts", "issue", "Issue receipts"),
    ("customers", "read", "View customers"),
    ("customers", "write", "Create and edit customers"),
    ("reports", "read", "View reports"),
    ("reports", "export", "Export reports"),
    ("system", "audit", "View audit logs"),
]

ROLE_PERMISSION_KEYS = {
    "superadmin": "*",
    "admin": {
        ("products", "read"),
        ("products", "write"),
        ("products", "delete"),
        ("products", "pricing"),
        ("inventory", "read"),
        ("inventory", "adjust"),
        ("pos", "sell"),
        ("pos", "void"),
        ("returns", "create"),
        ("returns", "approve"),
        ("receipts", "read"),
        ("receipts", "issue"),
        ("customers", "read"),
        ("customers", "write"),
        ("reports", "read"),
        ("reports", "export"),
        ("system", "audit"),
    },
    "staff": {
        ("products", "read"),
        ("inventory", "read"),
        ("pos", "sell"),
        ("returns", "create"),
        ("receipts", "read"),
        ("receipts", "issue"),
        ("customers", "read"),
        ("customers", "write"),
        ("reports", "read"),
    },
}


class Command(BaseCommand):
    help = "Seed baseline RBAC data for roles, permissions, and role-permission mappings."

    @transaction.atomic
    def handle(self, *args, **options):
        role_map = self._seed_roles()
        permission_map = self._seed_permissions()
        self._seed_role_permissions(role_map, permission_map)
        self.stdout.write(self.style.SUCCESS("RBAC seed completed."))

    def _seed_roles(self):
        role_map = {}
        for name, description in ROLE_DEFINITIONS:
            role, _ = Role.objects.get_or_create(
                name=name,
                defaults={
                    "description": description,
                    "is_active": True,
                },
            )
            role_map[name] = role
        return role_map

    def _seed_permissions(self):
        permission_map = {}
        for module, action, description in PERMISSION_DEFINITIONS:
            permission, _ = Permission.objects.get_or_create(
                module=module,
                action=action,
                defaults={"description": description},
            )
            permission_map[(module, action)] = permission
        return permission_map

    def _seed_role_permissions(self, role_map, permission_map):
        all_permissions = list(permission_map.values())

        for role_name, policy in ROLE_PERMISSION_KEYS.items():
            role = role_map[role_name]
            if policy == "*":
                for permission in all_permissions:
                    RolePermission.objects.get_or_create(role=role, permission=permission)
                continue

            for key in policy:
                permission = permission_map.get(key)
                if permission is None:
                    continue
                RolePermission.objects.get_or_create(role=role, permission=permission)

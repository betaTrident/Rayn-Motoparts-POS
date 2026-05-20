from django.core.management.base import BaseCommand
from django.db import transaction

from authentication.models import Permission, Role, RolePermission


ROLE_POLICY = {
    "admin": {
        ("products", "read"),
        ("products", "write"),
        ("products", "delete"),
        ("products", "pricing"),
        ("products", "cost"),
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
        ("settings", "read"),
        ("settings", "write"),
        ("users", "read"),
        ("users", "create"),
        ("users", "update"),
        ("users", "deactivate"),
        ("users", "reset_password"),
        ("roles", "read"),
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
    help = "Synchronize Admin/Staff role-permission assignments to the project policy."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show changes without writing to the database.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        for role_name, policy in ROLE_POLICY.items():
            role = Role.objects.filter(name=role_name, is_active=True).first()
            if role is None:
                self.stdout.write(self.style.WARNING(f"Role '{role_name}' not found or inactive. Skipping."))
                continue

            # Build exact expected set by key to avoid module/action cross-product matches.
            expected_permission_ids = set(
                Permission.objects.filter(module=module, action=action).values_list("id", flat=True).first()
                for module, action in policy
            )
            expected_permission_ids.discard(None)

            current_permission_ids = set(
                RolePermission.objects.filter(role=role).values_list("permission_id", flat=True)
            )

            to_add = expected_permission_ids - current_permission_ids
            to_remove = current_permission_ids - expected_permission_ids

            self.stdout.write(
                f"[{role_name}] add={len(to_add)} remove={len(to_remove)}"
            )

            if dry_run:
                continue

            for permission_id in to_add:
                RolePermission.objects.get_or_create(role=role, permission_id=permission_id)

            if to_remove:
                RolePermission.objects.filter(role=role, permission_id__in=to_remove).delete()

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run complete. No changes saved."))
        else:
            self.stdout.write(self.style.SUCCESS("RBAC policy sync complete."))

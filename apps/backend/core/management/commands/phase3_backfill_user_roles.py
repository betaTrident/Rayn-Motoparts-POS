from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from authentication.models import Role


class Command(BaseCommand):
    help = "Backfill users.role based on current auth flags (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show changes without updating users.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        user_model = get_user_model()

        role_map = {role.name: role for role in Role.objects.filter(name__in=["superadmin", "admin", "staff"])}
        missing = [name for name in ["superadmin", "admin", "staff"] if name not in role_map]
        if missing:
            self.stderr.write(
                self.style.ERROR(
                    "Missing required roles for backfill: " + ", ".join(missing) + ". "
                    "Run seed_rbac_data first."
                )
            )
            return

        users = user_model.objects.all().order_by("id")
        total = users.count()
        updated = 0

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 3 User Role Backfill"))
        self.stdout.write(f"Users scanned: {total}")
        self.stdout.write(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")

        for user in users.iterator():
            target_role = self._resolve_role(user, role_map)
            if user.role_id == target_role.id:
                continue

            updated += 1
            self.stdout.write(
                f"- user_id={user.id} email={user.email} role: "
                f"{self._name_or_none(user.role)} -> {target_role.name}"
            )

            if not dry_run:
                user.role = target_role
                user.save(update_fields=["role", "updated_at"])

        if dry_run:
            transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS(f"Users to update: {updated}"))
        self.stdout.write(self.style.SUCCESS("User role backfill complete."))

    def _resolve_role(self, user, role_map):
        if user.is_superuser:
            return role_map["superadmin"]
        if user.is_staff:
            return role_map["admin"]
        return role_map["staff"]

    def _name_or_none(self, role):
        return role.name if role else "None"

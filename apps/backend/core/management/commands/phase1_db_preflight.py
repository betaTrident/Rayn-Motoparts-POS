from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from core.db_design_targets import PROJECT_APP_LABELS, TARGET_TABLES


class Command(BaseCommand):
    help = "Run DB preflight checks before phased new-schema implementation."

    def add_arguments(self, parser):
        parser.add_argument(
            "--require-postgres",
            action="store_true",
            help="Fail if configured DB engine is not PostgreSQL.",
        )
        parser.add_argument(
            "--fail-on-pending-migrations",
            action="store_true",
            help="Fail if there are unapplied migrations.",
        )
        parser.add_argument(
            "--min-target-coverage",
            type=float,
            default=0.0,
            help="Fail if current model coverage of target tables is below this percentage (0-100).",
        )

    def handle(self, *args, **options):
        require_postgres = options["require_postgres"]
        fail_on_pending = options["fail_on_pending_migrations"]
        min_target_coverage = float(options["min_target_coverage"])

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 1 DB Preflight"))

        engine = settings.DATABASES["default"]["ENGINE"]
        vendor = connection.vendor
        self.stdout.write(f"Configured DB engine: {engine}")
        self.stdout.write(f"Connection vendor: {vendor}")

        if require_postgres and vendor != "postgresql":
            raise CommandError("Preflight failed: PostgreSQL is required for this run.")

        pending = self._get_pending_migrations()
        self.stdout.write(f"Pending migrations: {len(pending)}")
        for app_label, migration_name in pending:
            self.stdout.write(f"  - {app_label}.{migration_name}")

        if fail_on_pending and pending:
            raise CommandError("Preflight failed: unapplied migrations detected.")

        current_tables = self._get_current_project_model_tables()
        coverage = (len(current_tables & TARGET_TABLES) / len(TARGET_TABLES)) * 100
        missing = sorted(TARGET_TABLES - current_tables)

        self.stdout.write(f"Current model target coverage: {coverage:.2f}%")
        self.stdout.write(f"Mapped target tables present now: {len(current_tables & TARGET_TABLES)}")
        self.stdout.write(f"Target tables missing now: {len(missing)}")

        if missing:
            self.stdout.write("Top missing tables:")
            for name in missing[:15]:
                self.stdout.write(f"  - {name}")

        if min_target_coverage > 0 and coverage < min_target_coverage:
            raise CommandError(
                "Preflight failed: target coverage below threshold "
                f"({coverage:.2f}% < {min_target_coverage:.2f}%)."
            )

        self.stdout.write(self.style.SUCCESS("Phase 1 DB preflight passed."))

    def _get_pending_migrations(self):
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        plan = executor.migration_plan(targets)
        pending = []
        for migration, backwards in plan:
            if backwards:
                continue
            pending.append((migration.app_label, migration.name))
        return pending

    def _get_current_project_model_tables(self):
        table_names = set()
        for model in apps.get_models():
            if model._meta.app_label not in PROJECT_APP_LABELS:
                continue
            if not model._meta.managed:
                continue
            table_names.add(model._meta.db_table)
        return table_names

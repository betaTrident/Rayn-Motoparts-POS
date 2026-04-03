from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from core.db_design_targets import PROJECT_APP_LABELS, RETIREMENT_CANDIDATES, TARGET_TABLES


class Command(BaseCommand):
    help = "Validate current model tables against target DB design tables."

    def add_arguments(self, parser):
        parser.add_argument(
            "--strict",
            action="store_true",
            help="Fail if target tables are missing from current models.",
        )
        parser.add_argument(
            "--with-db",
            action="store_true",
            help="Also compare against actual database tables using introspection.",
        )

    def handle(self, *args, **options):
        strict = options["strict"]
        with_db = options["with_db"]

        current_model_tables = self._get_current_project_model_tables()
        missing_from_models = sorted(TARGET_TABLES - current_model_tables)
        not_in_target = sorted(current_model_tables - TARGET_TABLES)
        explicit_retirements = sorted(set(not_in_target) & RETIREMENT_CANDIDATES)
        unexpected_not_in_target = sorted(set(not_in_target) - RETIREMENT_CANDIDATES)

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 0 Table Mapping Validation"))
        self.stdout.write(f"Current project model tables: {len(current_model_tables)}")
        self.stdout.write(f"Target design tables: {len(TARGET_TABLES)}")

        self._print_section("Missing from current models (to add)", missing_from_models)
        self._print_section("Not in target design (review for retirement)", not_in_target)
        self._print_section("Retirement candidates confirmed", explicit_retirements)
        self._print_section("Unexpected not-in-target tables", unexpected_not_in_target)

        if with_db:
            db_tables = self._get_db_tables()
            if db_tables is not None:
                missing_from_db = sorted(TARGET_TABLES - db_tables)
                extra_in_db = sorted(db_tables - TARGET_TABLES)
                self.stdout.write("")
                self.stdout.write(self.style.MIGRATE_HEADING("Database Introspection"))
                self.stdout.write(f"Actual DB tables visible: {len(db_tables)}")
                self._print_section("Missing from DB", missing_from_db)
                self._print_section("Extra DB tables", extra_in_db)

        if strict and missing_from_models:
            raise CommandError(
                "Strict check failed: target tables missing from current models. "
                "Use the mapping matrix and phased plan before enabling strict mode."
            )

        self.stdout.write(self.style.SUCCESS("Phase 0 table mapping validation complete."))

    def _get_current_project_model_tables(self):
        table_names = set()
        for model in apps.get_models():
            app_label = model._meta.app_label
            if app_label not in PROJECT_APP_LABELS:
                continue
            if not model._meta.managed:
                continue
            table_names.add(model._meta.db_table)
        return table_names

    def _get_db_tables(self):
        try:
            return set(connection.introspection.table_names())
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"DB introspection skipped: {exc}"))
            return None

    def _print_section(self, title, items):
        self.stdout.write("")
        self.stdout.write(f"{title}: {len(items)}")
        for name in items:
            self.stdout.write(f"  - {name}")

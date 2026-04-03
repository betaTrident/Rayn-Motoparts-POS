from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from authentication.models import User
from inventory.models import InventoryStock, StockAdjustment, StockMovement
from pos.models import SalesReturn, SalesTransaction


class Command(BaseCommand):
    help = "Collapse warehouse-linked records into one canonical warehouse (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--canonical-warehouse-id",
            type=int,
            default=None,
            help="Canonical warehouse id. If omitted, auto-select lowest id POS location.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview and rollback all changes.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        _ = options["canonical_warehouse_id"]

        if not self._is_warehouse_retired():
            raise CommandError(
                "Warehouse fields still exist in this schema; run the earlier warehouse-collapse workflow "
                "from the compatible migration branch."
            )

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 3 Warehouse Collapse Backfill"))
        self.stdout.write(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")
        self.stdout.write(self.style.WARNING("Warehouse links are already retired in current models."))
        self.stdout.write(self.style.SUCCESS("No updates required."))

        if dry_run:
            transaction.set_rollback(True)

    def _is_warehouse_retired(self):
        models_to_check = [
            InventoryStock,
            StockMovement,
            StockAdjustment,
            SalesTransaction,
            SalesReturn,
            User,
        ]
        for model in models_to_check:
            try:
                model._meta.get_field('warehouse')
                return False
            except Exception:
                continue
        return True

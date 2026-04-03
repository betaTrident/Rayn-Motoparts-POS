from django.core.management.base import BaseCommand

from authentication.models import User
from inventory.models import InventoryStock, StockAdjustment, StockMovement
from pos.models import SalesReturn, SalesTransaction


class Command(BaseCommand):
    help = "Create a non-destructive plan for collapsing warehouse-linked data into single-store scope."

    def handle(self, *args, **options):
        if self._is_warehouse_retired():
            self.stdout.write(self.style.WARNING("Warehouse links are already retired in current models."))
            self.stdout.write(self.style.SUCCESS("No warehouse-collapse plan is needed."))
            return

        self.stdout.write(self.style.WARNING("Warehouse collapse planning is not supported in this schema revision."))

    def _is_warehouse_retired(self):
        models_to_check = [
            InventoryStock,
            StockMovement,
            StockAdjustment,
            SalesTransaction,
            SalesReturn,
            User,
        ]
        return all(not self._has_warehouse_field(model) for model in models_to_check)

    def _has_warehouse_field(self, model):
        try:
            model._meta.get_field('warehouse')
            return True
        except Exception:
            return False

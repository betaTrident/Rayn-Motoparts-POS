from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import ProductVariant
from inventory.models import InventoryStock, get_default_warehouse


class Command(BaseCommand):
    help = "Create missing inventory_stock rows for active product variants in the default warehouse."

    def handle(self, *args, **options):
        warehouse = get_default_warehouse()
        created_count = 0

        variants = ProductVariant.objects.filter(
            deleted_at__isnull=True,
            is_active=True,
            product__deleted_at__isnull=True,
            product__is_active=True,
        ).select_related("product")

        with transaction.atomic():
            for variant in variants.iterator(chunk_size=500):
                _, created = InventoryStock.objects.get_or_create(
                    product_variant=variant,
                    warehouse=warehouse,
                    defaults={
                        "qty_on_hand": Decimal("0"),
                        "qty_reserved": Decimal("0"),
                        "avg_cost": variant.effective_cost or Decimal("0"),
                    },
                )
                if created:
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Backfill complete. Created {created_count} missing inventory stock row(s)."
            )
        )

from decimal import Decimal

from django.db.models.signals import post_save
from django.dispatch import receiver

from inventory.models import InventoryStock, get_default_warehouse

from .models import ProductVariant


@receiver(post_save, sender=ProductVariant)
def ensure_inventory_stock_for_variant(sender, instance: ProductVariant, created: bool, **kwargs):
    if not created:
        return

    warehouse = get_default_warehouse()
    InventoryStock.objects.get_or_create(
        product_variant=instance,
        warehouse=warehouse,
        defaults={
            "qty_on_hand": Decimal("0"),
            "qty_reserved": Decimal("0"),
            "avg_cost": instance.effective_cost or Decimal("0"),
        },
    )

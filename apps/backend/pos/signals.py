from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from inventory.models import InventoryStock, StockMovement

from .models import SalesReturnItem, SalesTransactionItem


@receiver(post_save, sender=SalesTransactionItem)
def deduct_inventory_on_sale(sender, instance, created, **kwargs):
    if not created:
        return

    txn = instance.sales_transaction

    with transaction.atomic():
        stock = InventoryStock.objects.select_for_update().get(
            product_variant=instance.product_variant,
        )

        if stock.qty_on_hand < instance.qty:
            raise ValueError(
                f"Insufficient stock for variant {instance.product_variant.variant_sku}"
            )

        qty_before = stock.qty_on_hand
        qty_after = qty_before - instance.qty
        stock.qty_on_hand = qty_after
        stock.save(update_fields=['qty_on_hand', 'updated_at'])

        StockMovement.objects.create(
            product_variant=instance.product_variant,
            movement_type=StockMovement.MovementType.SALE,
            reference_type=StockMovement.ReferenceType.SALES_TRANSACTION,
            reference_id=txn.id,
            qty_before=qty_before,
            qty_change=-instance.qty,
            qty_after=qty_after,
            unit_cost=instance.unit_cost,
            performed_by=txn.cashier,
        )


@receiver(post_save, sender=SalesReturnItem)
def restore_inventory_on_return(sender, instance, created, **kwargs):
    if not created or not instance.restock:
        return

    sales_return = instance.sales_return

    with transaction.atomic():
        stock = InventoryStock.objects.select_for_update().get(
            product_variant=instance.product_variant,
        )
        qty_before = stock.qty_on_hand
        qty_after = qty_before + instance.qty_returned
        stock.qty_on_hand = qty_after
        stock.save(update_fields=['qty_on_hand', 'updated_at'])

        StockMovement.objects.create(
            product_variant=instance.product_variant,
            movement_type=StockMovement.MovementType.SALE_RETURN,
            reference_type=StockMovement.ReferenceType.SALES_RETURN,
            reference_id=sales_return.id,
            qty_before=qty_before,
            qty_change=instance.qty_returned,
            qty_after=qty_after,
            unit_cost=instance.unit_price,
            performed_by=sales_return.cashier,
        )

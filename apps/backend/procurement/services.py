from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from inventory.models import InventoryStock, StockMovement

from .models import PurchaseOrder, PurchaseOrderItem


def _update_purchase_order_status(purchase_order: PurchaseOrder) -> None:
    items = purchase_order.items.all()
    if not items.exists():
        return

    fully_received = all(item.received_qty >= item.ordered_qty for item in items)
    any_received = any(item.received_qty > 0 for item in items)

    if fully_received and purchase_order.status != PurchaseOrder.Status.RECEIVED:
        purchase_order.status = PurchaseOrder.Status.RECEIVED
        purchase_order.received_at = timezone.now()
        purchase_order.save(update_fields=['status', 'received_at', 'updated_at'])
    elif any_received and purchase_order.status not in {
        PurchaseOrder.Status.PARTIALLY_RECEIVED,
        PurchaseOrder.Status.RECEIVED,
    }:
        purchase_order.status = PurchaseOrder.Status.PARTIALLY_RECEIVED
        purchase_order.save(update_fields=['status', 'updated_at'])


def apply_purchase_receipt(item: PurchaseOrderItem, qty_received_delta: Decimal, performed_by) -> None:
    if qty_received_delta <= 0:
        return

    with transaction.atomic():
        po = PurchaseOrder.objects.select_for_update().get(pk=item.purchase_order_id)

        stock, _ = InventoryStock.objects.get_or_create(
            product_variant=item.product_variant,
            warehouse=po.warehouse,
            defaults={
                'qty_on_hand': Decimal('0'),
                'qty_reserved': Decimal('0'),
                'reorder_point': Decimal('0'),
                'reorder_qty': Decimal('0'),
                'avg_cost': Decimal('0'),
            },
        )
        stock = InventoryStock.objects.select_for_update().get(pk=stock.pk)

        qty_before = stock.qty_on_hand
        qty_after = qty_before + qty_received_delta

        if qty_after > 0:
            weighted_cost = (stock.avg_cost * qty_before) + (item.unit_cost * qty_received_delta)
            stock.avg_cost = weighted_cost / qty_after

        stock.qty_on_hand = qty_after
        stock.save(update_fields=['qty_on_hand', 'avg_cost', 'updated_at'])

        StockMovement.objects.create(
            product_variant=item.product_variant,
            warehouse=po.warehouse,
            movement_type=StockMovement.MovementType.PURCHASE_RECEIPT,
            reference_type=StockMovement.ReferenceType.PURCHASE_ORDER,
            reference_id=po.id,
            qty_before=qty_before,
            qty_change=qty_received_delta,
            qty_after=qty_after,
            unit_cost=item.unit_cost,
            performed_by=performed_by,
        )

        _update_purchase_order_status(po)

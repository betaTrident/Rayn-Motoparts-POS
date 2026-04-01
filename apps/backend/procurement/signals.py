from decimal import Decimal

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import PurchaseOrderItem
from .services import apply_purchase_receipt


@receiver(pre_save, sender=PurchaseOrderItem)
def capture_previous_received_qty(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_received_qty = Decimal('0')
        return

    previous = sender.objects.filter(pk=instance.pk).values_list('received_qty', flat=True).first()
    instance._previous_received_qty = previous if previous is not None else Decimal('0')


@receiver(post_save, sender=PurchaseOrderItem)
def apply_stock_on_po_receipt(sender, instance, created, **kwargs):
    previous_received = getattr(instance, '_previous_received_qty', Decimal('0'))
    delta = instance.received_qty - previous_received
    if delta <= 0:
        return

    performed_by = instance.purchase_order.ordered_by
    apply_purchase_receipt(instance, delta, performed_by)

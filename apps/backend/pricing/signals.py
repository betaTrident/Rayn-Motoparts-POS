from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone

from catalog.models import ProductVariant
from procurement.models import SupplierProduct

from .models import ProductPriceHistory, SupplierCostHistory


@receiver(pre_save, sender=ProductVariant)
def track_product_variant_price_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    old = sender.objects.filter(pk=instance.pk).only('selling_price').first()
    if old is None:
        return

    if old.selling_price != instance.selling_price and instance.selling_price is not None:
        ProductPriceHistory.objects.create(
            product_variant=instance,
            old_price=old.selling_price or 0,
            new_price=instance.selling_price,
            changed_by=getattr(instance, '_changed_by', None),
            effective_date=timezone.now().date(),
        )


@receiver(pre_save, sender=SupplierProduct)
def track_supplier_cost_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    old = sender.objects.filter(pk=instance.pk).only('last_cost').first()
    if old is None:
        return

    if old.last_cost != instance.last_cost:
        SupplierCostHistory.objects.create(
            supplier=instance.supplier,
            product_variant=instance.product_variant,
            old_cost=old.last_cost,
            new_cost=instance.last_cost,
            changed_by=getattr(instance, '_changed_by', None),
            effective_date=timezone.now().date(),
        )

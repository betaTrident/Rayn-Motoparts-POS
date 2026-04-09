from datetime import date

from django.db import models

from core.models import SoftDeleteModel


def current_year_plus_one():
    return date.today().year + 1


class VehicleMake(SoftDeleteModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'vehicle_makes'
        ordering = ['name']

    def __str__(self):
        return self.name


class VehicleModel(SoftDeleteModel):
    make = models.ForeignKey(
        VehicleMake,
        on_delete=models.PROTECT,
        related_name='models',
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'vehicle_models'
        ordering = ['make__name', 'name']
        constraints = [
            models.UniqueConstraint(fields=['make', 'name'], name='uq_vehicle_model_make_name'),
            models.UniqueConstraint(fields=['make', 'slug'], name='uq_vehicle_model_make_slug'),
        ]

    def __str__(self):
        return f"{self.make.name} {self.name}"


class ProductVehicleFitment(SoftDeleteModel):
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='fitments')
    vehicle_model = models.ForeignKey(
        VehicleModel,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='product_fitments',
    )
    year_range = models.CharField(max_length=30, null=True, blank=True)
    fitment_notes = models.CharField(max_length=400, null=True, blank=True)
    notes = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_vehicle_fitments'
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'vehicle_model', 'year_range'],
                name='uq_product_vehicle_fitment_v2',
            ),
        ]
        indexes = [
            models.Index(fields=['vehicle_model', 'product'], name='idx_fitment_model_product'),
        ]

    def __str__(self):
        if self.vehicle_model and self.year_range:
            return f"{self.product.sku} -> {self.vehicle_model} ({self.year_range})"
        return f"{self.product.sku} -> UNMAPPED"

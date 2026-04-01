from datetime import date

from django.core.validators import MaxValueValidator, MinValueValidator
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


class VehicleYear(SoftDeleteModel):
    model = models.ForeignKey(
        VehicleModel,
        on_delete=models.PROTECT,
        related_name='years',
    )
    year = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1950),
            MaxValueValidator(current_year_plus_one),
        ]
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'vehicle_years'
        ordering = ['-year']
        constraints = [
            models.UniqueConstraint(fields=['model', 'year'], name='uq_vehicle_year_model_year'),
        ]

    def __str__(self):
        return f"{self.model} {self.year}"


class ProductVehicleFitment(SoftDeleteModel):
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='fitments')
    vehicle_year = models.ForeignKey(VehicleYear, on_delete=models.CASCADE, related_name='fitments')
    notes = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_vehicle_fitments'
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'vehicle_year'],
                name='uq_product_vehicle_fitment',
            ),
        ]
        indexes = [
            models.Index(fields=['vehicle_year', 'product'], name='idx_fitment_vehicle_product'),
        ]

    def __str__(self):
        return f"{self.product.sku} -> {self.vehicle_year}"

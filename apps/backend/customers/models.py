from django.db import models

from core.models import SoftDeleteModel, TimeStampedModel


class Customer(SoftDeleteModel):
    customer_code = models.CharField(max_length=30, unique=True)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120, null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'customers'
        indexes = [
            models.Index(fields=['phone', 'is_active'], name='idx_customer_phone_active'),
        ]
        ordering = ['first_name', 'last_name']

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name or ''}".strip()
        return f"{self.customer_code} - {full_name}"


class CustomerAddress(TimeStampedModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=80, default='default')
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=120, null=True, blank=True)
    state = models.CharField(max_length=120, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = 'customer_addresses'
        constraints = [
            models.UniqueConstraint(fields=['customer', 'label'], name='uq_customer_address_label'),
        ]

    def __str__(self):
        return f"{self.customer.customer_code} :: {self.label}"

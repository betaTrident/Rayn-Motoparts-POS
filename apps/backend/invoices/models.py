from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import TimeStampedModel


class InvoiceSequence(TimeStampedModel):
    invoice_type = models.CharField(max_length=40, unique=True)
    prefix = models.CharField(max_length=20, default='INV')
    current_value = models.BigIntegerField(default=0)

    class Meta:
        db_table = 'invoice_sequences'


class BusinessProfile(TimeStampedModel):
    name = models.CharField(max_length=200)
    tax_number = models.CharField(max_length=60, null=True, blank=True)
    address = models.CharField(max_length=400, null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = 'business_profiles'


class Invoice(TimeStampedModel):
    class InvoiceType(models.TextChoices):
        SALES_INVOICE = 'sales_invoice', 'Sales Invoice'
        SALES_RETURN = 'sales_return', 'Sales Return'

    class Status(models.TextChoices):
        ISSUED = 'issued', 'Issued'
        CANCELLED = 'cancelled', 'Cancelled'

    invoice_number = models.CharField(max_length=40, unique=True)
    invoice_type = models.CharField(max_length=40, choices=InvoiceType.choices)
    sales_transaction = models.ForeignKey(
        'pos.SalesTransaction',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='invoices',
    )
    customer = models.ForeignKey(
        'customers.Customer',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.PROTECT)
    issued_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ISSUED)
    issued_at = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta:
        db_table = 'invoices'
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['invoice_type', 'issued_at'], name='idx_invoice_type_issued_at'),
        ]


class InvoiceItem(TimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=12, decimal_places=4, validators=[MinValueValidator(0.0001)])
    unit_price = models.DecimalField(max_digits=14, decimal_places=4, validators=[MinValueValidator(0)])
    tax_rate = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta:
        db_table = 'invoice_items'


class InvoicePayment(TimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.ForeignKey('pos.PaymentMethod', on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=14, decimal_places=4, validators=[MinValueValidator(0.0001)])
    reference_number = models.CharField(max_length=120, null=True, blank=True)

    class Meta:
        db_table = 'invoice_payments'

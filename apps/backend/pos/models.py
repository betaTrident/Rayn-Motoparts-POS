from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import TimeStampedModel


class PosTerminal(TimeStampedModel):
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=120)
    warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'pos_terminals'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class CashSession(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'

    pos_terminal = models.ForeignKey(PosTerminal, on_delete=models.PROTECT, related_name='cash_sessions')
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cash_sessions',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    opening_balance = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    closing_balance = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'cash_sessions'
        ordering = ['-opened_at']
        indexes = [
            models.Index(fields=['status', 'opened_at'], name='idx_cash_session_status_opened'),
        ]

    def __str__(self):
        return f"{self.pos_terminal.code} :: {self.status}"


class Discount(TimeStampedModel):
    class DiscountType(models.TextChoices):
        FIXED = 'fixed', 'Fixed'
        PERCENT = 'percent', 'Percent'

    name = models.CharField(max_length=120, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=12, decimal_places=4, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'discounts'
        ordering = ['name']

    def __str__(self):
        return self.name


class SalesTransaction(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        VOIDED = 'voided', 'Voided'
        REFUNDED = 'refunded', 'Refunded'
        PARTIALLY_REFUNDED = 'partially_refunded', 'Partially Refunded'

    transaction_number = models.CharField(max_length=30, unique=True)
    cash_session = models.ForeignKey(CashSession, on_delete=models.PROTECT)
    pos_terminal = models.ForeignKey(PosTerminal, on_delete=models.PROTECT)
    warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.PROTECT)
    customer = models.ForeignKey(
        'customers.Customer',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='transactions_as_cashier',
    )
    customer_name = models.CharField(max_length=180, null=True, blank=True)
    discount = models.ForeignKey(Discount, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING)
    transaction_date = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    amount_tendered = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    change_given = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    voided_at = models.DateTimeField(null=True, blank=True)
    voided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='voided_transactions',
    )
    void_reason = models.CharField(max_length=300, null=True, blank=True)

    class Meta:
        db_table = 'sales_transactions'
        indexes = [
            models.Index(
                fields=['warehouse', 'transaction_date', 'status'],
                name='idx_sales_txn_reporting',
            ),
            models.Index(fields=['status'], name='idx_sales_txn_status'),
        ]

    def __str__(self):
        return self.transaction_number


class SalesTransactionItem(TimeStampedModel):
    sales_transaction = models.ForeignKey(
        SalesTransaction,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=12, decimal_places=4, validators=[MinValueValidator(0.0001)])
    unit_price = models.DecimalField(max_digits=14, decimal_places=4, validators=[MinValueValidator(0)])
    unit_cost = models.DecimalField(max_digits=14, decimal_places=6, validators=[MinValueValidator(0)])
    tax_rate = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    line_subtotal = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    line_tax_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta:
        db_table = 'sales_transaction_items'
        indexes = [
            models.Index(fields=['sales_transaction', 'product_variant'], name='idx_sti_txn_variant'),
        ]

    def save(self, *args, **kwargs):
        self.line_subtotal = self.qty * self.unit_price
        taxable = self.line_subtotal - self.discount_amount
        self.line_tax_amount = taxable * (self.tax_rate / 100)
        self.line_total = taxable + self.line_tax_amount
        super().save(*args, **kwargs)


class PaymentMethod(TimeStampedModel):
    name = models.CharField(max_length=80, unique=True)
    code = models.CharField(max_length=40, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'payment_methods'
        ordering = ['name']

    def __str__(self):
        return self.name


class TransactionPayment(TimeStampedModel):
    sales_transaction = models.ForeignKey(
        SalesTransaction,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=14, decimal_places=4, validators=[MinValueValidator(0.0001)])
    reference_number = models.CharField(max_length=120, null=True, blank=True)

    class Meta:
        db_table = 'transaction_payments'
        indexes = [
            models.Index(fields=['sales_transaction', 'payment_method'], name='idx_txn_payments_lookup'),
        ]


class SalesReturn(TimeStampedModel):
    sales_transaction = models.ForeignKey(
        SalesTransaction,
        on_delete=models.PROTECT,
        related_name='returns',
    )
    warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.PROTECT)
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    reason = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'sales_returns'
        ordering = ['-created_at']


class SalesReturnItem(TimeStampedModel):
    sales_return = models.ForeignKey(SalesReturn, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.PROTECT)
    qty_returned = models.DecimalField(max_digits=12, decimal_places=4, validators=[MinValueValidator(0.0001)])
    unit_price = models.DecimalField(max_digits=14, decimal_places=4, validators=[MinValueValidator(0)])
    restock = models.BooleanField(default=True)

    class Meta:
        db_table = 'sales_return_items'
        indexes = [
            models.Index(fields=['sales_return', 'product_variant'], name='idx_sri_return_variant'),
        ]

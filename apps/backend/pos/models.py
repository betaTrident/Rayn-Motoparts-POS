from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import TimeStampedModel


class CashSession(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'

    session_code = models.CharField(max_length=30, unique=True, null=True, blank=True)
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
        return f"{self.session_code or self.id} :: {self.status}"


class SalesTransaction(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        VOIDED = 'voided', 'Voided'
        REFUNDED = 'refunded', 'Refunded'
        PARTIALLY_REFUNDED = 'partially_refunded', 'Partially Refunded'

    transaction_number = models.CharField(max_length=30, unique=True)
    cash_session = models.ForeignKey(CashSession, on_delete=models.PROTECT)
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
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING)
    transaction_date = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=4, default=0)
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
                fields=['transaction_date', 'status'],
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
        taxable = self.line_subtotal
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


class Discount(TimeStampedModel):
    class Type(models.TextChoices):
        PERCENTAGE = 'percentage', 'Percentage'
        FIXED_AMOUNT = 'fixed_amount', 'Fixed Amount'

    class AppliesTo(models.TextChoices):
        TRANSACTION = 'transaction', 'Transaction'
        ITEM = 'item', 'Item'
        CATEGORY = 'category', 'Category'
        PRODUCT = 'product', 'Product'

    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=20, choices=Type.choices)
    value = models.DecimalField(max_digits=10, decimal_places=4)
    applies_to = models.CharField(max_length=20, choices=AppliesTo.choices, default=AppliesTo.TRANSACTION)
    target_id = models.BigIntegerField(null=True, blank=True)
    min_purchase = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)
    usage_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'discounts'
        ordering = ['code']


class BusinessProfile(TimeStampedModel):
    business_name = models.CharField(max_length=200)
    tagline = models.CharField(max_length=300, null=True, blank=True)
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, null=True, blank=True)
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100, null=True, blank=True)
    zip_code = models.CharField(max_length=20, null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    mobile = models.CharField(max_length=30, null=True, blank=True)
    email = models.EmailField(max_length=200, null=True, blank=True)
    tin = models.CharField(max_length=50, null=True, blank=True)
    bir_accreditation_no = models.CharField(max_length=100, null=True, blank=True)
    logo_url = models.URLField(max_length=512, null=True, blank=True)
    receipt_footer = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'business_profile'


class ReceiptSequence(models.Model):
    series_code = models.CharField(max_length=20, unique=True)
    series_label = models.CharField(max_length=60)
    prefix = models.CharField(max_length=20, null=True, blank=True)
    current_number = models.BigIntegerField(default=0)
    zero_pad = models.PositiveSmallIntegerField(default=6)
    start_number = models.BigIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'receipt_sequences'


class Receipt(models.Model):
    class ReceiptType(models.TextChoices):
        OFFICIAL_RECEIPT = 'official_receipt', 'Official Receipt'
        SALES_INVOICE = 'sales_invoice', 'Sales Invoice'
        DELIVERY_RECEIPT = 'delivery_receipt', 'Delivery Receipt'

    class Status(models.TextChoices):
        ISSUED = 'issued', 'Issued'
        VOID = 'void', 'Void'

    receipt_number = models.CharField(max_length=50, unique=True)
    receipt_type = models.CharField(
        max_length=20,
        choices=ReceiptType.choices,
        default=ReceiptType.OFFICIAL_RECEIPT,
    )
    receipt_sequence = models.ForeignKey(ReceiptSequence, on_delete=models.PROTECT)
    sales_transaction = models.OneToOneField(
        SalesTransaction,
        on_delete=models.PROTECT,
        related_name='receipt',
    )
    customer = models.ForeignKey(
        'customers.Customer',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    buyer_name = models.CharField(max_length=200, default='Walk-in Customer')
    buyer_address = models.TextField(null=True, blank=True)
    buyer_tin = models.CharField(max_length=50, null=True, blank=True)
    buyer_phone = models.CharField(max_length=30, null=True, blank=True)
    seller_name = models.CharField(max_length=200)
    seller_address = models.TextField()
    seller_tin = models.CharField(max_length=50, null=True, blank=True)
    seller_phone = models.CharField(max_length=30, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    vat_exempt_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    zero_rated_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    amount_paid = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    change_given = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ISSUED)
    issued_at = models.DateTimeField(auto_now_add=True)
    voided_at = models.DateTimeField(null=True, blank=True)
    voided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='voided_receipts',
    )
    void_reason = models.CharField(max_length=300, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    printed_count = models.PositiveSmallIntegerField(default=0)
    last_printed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_receipts',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'receipts'
        indexes = [
            models.Index(fields=['customer'], name='idx_receipts_customer'),
            models.Index(fields=['issued_at'], name='idx_receipts_issued_at'),
            models.Index(fields=['status'], name='idx_receipts_status'),
        ]


class ReceiptItem(models.Model):
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name='items')
    line_number = models.PositiveSmallIntegerField()
    product_variant = models.ForeignKey(
        'catalog.ProductVariant',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    sku = models.CharField(max_length=100)
    description = models.CharField(max_length=400)
    unit_of_measure = models.CharField(max_length=20, default='pcs')
    qty = models.DecimalField(max_digits=12, decimal_places=4)
    unit_price = models.DecimalField(max_digits=12, decimal_places=4)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=4)

    class Meta:
        db_table = 'receipt_items'
        indexes = [
            models.Index(fields=['receipt'], name='idx_receipt_items_receipt'),
        ]


class ReceiptPayment(models.Model):
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    payment_method_name = models.CharField(max_length=80)
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        validators=[MinValueValidator(0.0001)],
    )
    reference_number = models.CharField(max_length=100, null=True, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'receipt_payments'
        indexes = [
            models.Index(fields=['receipt'], name='idx_receipt_payments_receipt'),
        ]

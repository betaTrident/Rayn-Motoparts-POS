# Database Implementation Plan
# Rayn Motoparts POS — Django + PostgreSQL

> **Prepared:** 2026-04-01
> **Stack:** Django 6.0.2 · Django REST Framework · SimpleJWT · PostgreSQL · psycopg2

---

## Table of Contents

1. [Current Setup Snapshot](#1-current-setup-snapshot)
2. [MySQL → PostgreSQL Conversion Notes](#2-mysql--postgresql-conversion-notes)
3. [JWT Auth & User Model Impact Analysis](#3-jwt-auth--user-model-impact-analysis)
4. [Django App Architecture](#4-django-app-architecture)
5. [Model Implementation (Per App)](#5-model-implementation-per-app)
6. [Replacing Triggers with Django Signals & Services](#6-replacing-triggers-with-django-signals--services)
7. [PostgreSQL-Specific Enhancements](#7-postgresql-specific-enhancements)
8. [Index Strategy](#8-index-strategy)
9. [Audit Logging with django-auditlog](#9-audit-logging-with-django-auditlog)
10. [Migration Order & Phased Rollout](#10-migration-order--phased-rollout)
11. [New Package Dependencies](#11-new-package-dependencies)
12. [Checklist Summary](#12-checklist-summary)

---

## 1. Current Setup Snapshot

| Layer | Technology | Notes |
|---|---|---|
| Backend Framework | Django 6.0.2 | Already installed |
| API Layer | Django REST Framework 3.16.1 | Already installed |
| Auth | `djangorestframework-simplejwt` 5.5.1 | JWT with blacklist enabled |
| Database Driver | `psycopg2-binary` 2.9.11 | **PostgreSQL already wired up** |
| DB Backend in settings | `django.db.backends.postgresql` | Already PostgreSQL |
| Audit | `django-auditlog` 3.4.1 | Already installed |
| User Model | Custom `authentication.User` (AbstractUser) | Email login, `db_table = 'users'` |

> **Important:** Your project is **already on PostgreSQL** — not MySQL.
> The `psycopg2-binary` driver and `settings.py` both confirm this. All MySQL-specific
> syntax in the design doc (`ENGINE=InnoDB`, `AUTO_INCREMENT`, `TINYINT(1)`, `utf8mb4`)
> is irrelevant — Django's ORM handles everything natively for PostgreSQL.

---

## 2. MySQL → PostgreSQL Conversion Notes

| MySQL Construct | Django / PostgreSQL Equivalent |
|---|---|
| `BIGINT AUTO_INCREMENT` | `BigAutoField` (default PK in Django) |
| `TINYINT(1)` (boolean) | `BooleanField` |
| `SMALLINT AUTO_INCREMENT` | `SmallAutoField` |
| `DECIMAL(12,4)` | `DecimalField(max_digits=12, decimal_places=4)` |
| `VARCHAR(n)` | `CharField(max_length=n)` |
| `TEXT` | `TextField` |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `DateTimeField(auto_now_add=True)` |
| `ON UPDATE CURRENT_TIMESTAMP` | `DateTimeField(auto_now=True)` |
| `ENUM(...)` | `CharField(choices=...)` with `TextChoices` |
| `JSON` column | `JSONField` → stored as PostgreSQL `JSONB` |
| `GENERATED ALWAYS AS (...) STORED` | `GeneratedField(db_persist=True)` (Django 5+) |
| `GENERATED ALWAYS AS (...) VIRTUAL` | Python `@property` on the model |
| `ENGINE=InnoDB` | Not needed — PostgreSQL default |
| `utf8mb4` charset | Not needed — PostgreSQL uses UTF-8 by default |
| Stored Procedures | Python service functions (`services.py`) |
| Triggers | Django `post_save` / `pre_save` **Signals** |
| `SELECT ... FOR UPDATE` | `.select_for_update()` queryset method |
| `CHECK (qty >= 0)` | `MinValueValidator(0)` + `CheckConstraint` in `Meta` |
| `ON DELETE RESTRICT` | `on_delete=models.PROTECT` |
| `ON DELETE CASCADE` | `on_delete=models.CASCADE` |
| `ON DELETE SET NULL` | `on_delete=models.SET_NULL` |
| `UNIQUE KEY` | `unique=True` or `UniqueConstraint` in `Meta` |

### PostgreSQL Advantages for This Design

- **Native JSONB**: `JSONField` maps to `JSONB` which supports GIN indexing — important
  for `product_variants.attributes` and fast key-based queries.
- **`GeneratedField`** (Django 5/6): `margin_pct` and `markup_pct` can be true
  database-computed columns without raw SQL.
- **`SELECT FOR UPDATE SKIP LOCKED`**: Useful for POS session management queues.
- **Full ACID + serializable isolation**: More robust than MySQL InnoDB for concurrent
  POS writes across multiple terminals.
- **`django-auditlog`** integrates cleanly with the existing setup.

---

## 3. JWT Auth & User Model Impact Analysis

### Does the existing JWT implementation affect the DB design?

**Yes — and it requires deliberate integration. Full analysis below.**

---

### 3.1 The `users` Table Conflict

The DB design specifies a `users` table with custom fields: `pin_hash`, `warehouse_id`,
and `last_login_at`. Your current `authentication.User` model already creates a `users`
table (via `db_table = 'users'`).

**Resolution:** Extend the **existing** custom User model — do NOT create a separate
`users` table or app. Add the missing fields directly to `authentication.User`:

```python
# authentication/models.py — Extended for POS fields
class User(AbstractUser):
    email         = models.EmailField(unique=True)
    phone         = models.CharField(max_length=30, null=True, blank=True)
    pin_hash      = models.CharField(max_length=255, null=True, blank=True)
    warehouse     = models.ForeignKey(
                        'inventory.Warehouse', null=True, blank=True,
                        on_delete=models.SET_NULL, related_name='users'
                    )
    last_login_at = models.DateTimeField(null=True, blank=True)  # updated on JWT login
    deleted_at    = models.DateTimeField(null=True, blank=True)  # soft delete

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
```

> **Warning:** Never create a second `users` table in another app. All FKs referencing
> users (e.g., `performed_by` in `stock_movements`, `cashier_id` in `cash_sessions`)
> must use `settings.AUTH_USER_MODEL` — not a hardcoded string model path.

---

### 3.2 JWT Token Blacklist Tables

The `rest_framework_simplejwt.token_blacklist` app (already in `INSTALLED_APPS`) creates:
- `token_blacklist_outstandingtoken`
- `token_blacklist_blacklistedtoken`

These are **completely separate** from the inventory/POS schema and have no conflicts.
They are managed by the JWT package's own migrations.

---

### 3.3 Embedding Roles in JWT Claims (RBAC)

The DB design has `roles`, `permissions`, and `role_permissions`. Django's built-in
`Group` + `Permission` system partially overlaps. Best approach:

- Use Django's built-in **`Group`** as the `roles` table (`auth_group`).
- Embed roles in the JWT access token payload — eliminates a DB hit on every request.

```python
# authentication/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['roles']        = list(user.groups.values_list('name', flat=True))
        token['warehouse_id'] = user.warehouse_id
        return token
```

---

### 3.4 PIN-Based POS Quick Login

The design includes a `pin_hash` for POS terminal quick login. This is a **separate auth
flow** from the main JWT login. Implement it as an additional endpoint:

```
POST /api/auth/pin-login/
```

This validates the PIN and returns a short-lived JWT with limited scope (e.g., a
`pos_only: true` claim) so cashiers can authenticate quickly at the terminal.

---

### 3.5 Soft Delete for Users

The `deleted_at` field means users are never hard-deleted. Django's `is_active=False`
pattern achieves the same thing. Keep **both**: set `is_active=False` AND
`deleted_at=now()` on deactivation, so Django's auth guards still work correctly.

---

### 3.6 last_login_at Update

Django's `AbstractUser` has `last_login` (updated by the auth framework). Override
`LoginView` to also set `last_login_at` (your custom POS display column) on each
successful credential and PIN authentication.

---

## 4. Django App Architecture

Organize the backend into focused Django apps. Create each with
`python manage.py startapp <name>` inside `apps/backend/`.

```
apps/backend/
├── authentication/     ← EXISTS: extend User model here
├── core/               ← [NEW] Shared base models (TimeStampedModel, SoftDeleteModel)
├── catalog/            ← [NEW] Brand, Category, Product, ProductVariant, Barcode
├── vehicles/           ← [NEW] VehicleMake, VehicleModel, VehicleYear, Fitments
├── inventory/          ← [NEW] Warehouse, InventoryStock, StockMovement, Adjustments
├── procurement/        ← [NEW] Supplier, SupplierProduct, PurchaseOrder, POItems
├── pos/                ← [NEW] Terminal, CashSession, SalesTransaction, Returns
├── invoices/           ← [NEW] InvoiceSequence, Invoice, InvoiceItems, Payments
├── customers/          ← [NEW] Customer, CustomerAddress
├── pricing/            ← [NEW] PriceTier, TierRules, PriceHistory, CostHistory
└── config/             ← EXISTS: settings, urls, wsgi
```

### Base Model (core/models.py)

```python
# core/models.py
from django.db import models
from django.utils import timezone

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class SoftDeleteModel(TimeStampedModel):
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    class Meta:
        abstract = True
```

---

## 5. Model Implementation (Per App)

### 5.1 `catalog` App

```python
# catalog/models.py
from django.db import models
from core.models import SoftDeleteModel

class Brand(SoftDeleteModel):
    name           = models.CharField(max_length=120, unique=True)
    slug           = models.SlugField(max_length=120, unique=True)
    logo_url       = models.URLField(max_length=512, null=True, blank=True)
    country_origin = models.CharField(max_length=2, null=True, blank=True)
    is_active      = models.BooleanField(default=True)

    class Meta:
        db_table = 'brands'


class Category(SoftDeleteModel):
    parent      = models.ForeignKey('self', null=True, blank=True,
                                    on_delete=models.PROTECT, related_name='children')
    name        = models.CharField(max_length=120, unique=True)
    slug        = models.SlugField(max_length=120, unique=True)
    description = models.TextField(null=True, blank=True)
    sort_order  = models.SmallIntegerField(default=0)
    is_active   = models.BooleanField(default=True)

    class Meta:
        db_table = 'categories'
        ordering = ['sort_order', 'name']


class Product(SoftDeleteModel):
    category      = models.ForeignKey('catalog.Category', on_delete=models.PROTECT)
    brand         = models.ForeignKey('catalog.Brand', null=True, blank=True,
                                      on_delete=models.SET_NULL)
    uom           = models.ForeignKey('catalog.UnitOfMeasure', on_delete=models.PROTECT)
    tax_rate      = models.ForeignKey('catalog.TaxRate', on_delete=models.PROTECT)
    sku           = models.CharField(max_length=80, unique=True)
    name          = models.CharField(max_length=220)
    description   = models.TextField(null=True, blank=True)
    part_number   = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    cost_price    = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    is_taxable    = models.BooleanField(default=True)
    is_serialized = models.BooleanField(default=False)
    is_active     = models.BooleanField(default=True)

    class Meta:
        db_table = 'products'


class ProductVariant(SoftDeleteModel):
    product       = models.ForeignKey(Product, on_delete=models.CASCADE,
                                      related_name='variants')
    variant_sku   = models.CharField(max_length=100, unique=True)
    variant_name  = models.CharField(max_length=200, null=True, blank=True)
    # Stored as PostgreSQL JSONB — supports GIN indexing
    attributes    = models.JSONField(null=True, blank=True)
    cost_price    = models.DecimalField(max_digits=12, decimal_places=4,
                                        null=True, blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=4,
                                        null=True, blank=True)
    is_active     = models.BooleanField(default=True)

    @property
    def effective_cost(self):
        return self.cost_price or self.product.cost_price

    @property
    def effective_price(self):
        return self.selling_price or self.product.selling_price

    @property
    def margin_pct(self):
        price, cost = self.effective_price, self.effective_cost
        if price and price > 0:
            return round(((price - cost) / price) * 100, 4)
        return None

    @property
    def markup_pct(self):
        cost, price = self.effective_cost, self.effective_price
        if cost and cost > 0:
            return round(((price - cost) / cost) * 100, 4)
        return None

    class Meta:
        db_table = 'product_variants'
        indexes  = [
            # GIN index on JSONB attributes for fast key lookups
            # Declared via migration using django.contrib.postgres.indexes.GinIndex
        ]
```

### 5.2 `inventory` App

```python
# inventory/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from core.models import TimeStampedModel

class Warehouse(TimeStampedModel):
    code            = models.CharField(max_length=20, unique=True)
    name            = models.CharField(max_length=120)
    address         = models.CharField(max_length=400, null=True, blank=True)
    city            = models.CharField(max_length=100, null=True, blank=True)
    is_pos_location = models.BooleanField(default=True)
    is_active       = models.BooleanField(default=True)

    class Meta:
        db_table = 'warehouses'


class InventoryStock(models.Model):
    product_variant  = models.ForeignKey('catalog.ProductVariant',
                                          on_delete=models.PROTECT)
    warehouse        = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    qty_on_hand      = models.DecimalField(max_digits=12, decimal_places=4, default=0,
                                           validators=[MinValueValidator(0)])
    qty_reserved     = models.DecimalField(max_digits=12, decimal_places=4, default=0,
                                           validators=[MinValueValidator(0)])
    reorder_point    = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    reorder_qty      = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    max_stock_level  = models.DecimalField(max_digits=12, decimal_places=4,
                                           null=True, blank=True)
    avg_cost         = models.DecimalField(max_digits=14, decimal_places=6, default=0)
    last_counted_at  = models.DateTimeField(null=True, blank=True)
    updated_at       = models.DateTimeField(auto_now=True)

    # Computed in Python (equivalent to MySQL VIRTUAL generated column)
    @property
    def qty_available(self):
        return self.qty_on_hand - self.qty_reserved

    @property
    def stock_status(self):
        if self.qty_available <= 0:
            return 'OUT_OF_STOCK'
        if self.qty_available <= self.reorder_point:
            return 'LOW_STOCK'
        return 'IN_STOCK'

    class Meta:
        db_table        = 'inventory_stock'
        unique_together = [('product_variant', 'warehouse')]
        constraints     = [
            models.CheckConstraint(
                check=models.Q(qty_on_hand__gte=0),
                name='chk_stock_qty_non_negative'
            ),
            models.CheckConstraint(
                check=models.Q(qty_reserved__gte=0),
                name='chk_stock_reserved_non_negative'
            ),
        ]
        indexes = [
            models.Index(
                fields=['product_variant', 'warehouse', 'qty_on_hand'],
                name='idx_inventory_stock_lookup'
            ),
            models.Index(
                fields=['warehouse', 'qty_on_hand', 'reorder_point'],
                name='idx_inventory_low_stock'
            ),
        ]


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        SALE             = 'sale', 'Sale'
        SALE_RETURN      = 'sale_return', 'Sale Return'
        PURCHASE_RECEIPT = 'purchase_receipt', 'Purchase Receipt'
        PURCHASE_RETURN  = 'purchase_return', 'Purchase Return'
        ADJUSTMENT_ADD   = 'adjustment_add', 'Adjustment Add'
        ADJUSTMENT_SUB   = 'adjustment_sub', 'Adjustment Subtract'
        TRANSFER_OUT     = 'transfer_out', 'Transfer Out'
        TRANSFER_IN      = 'transfer_in', 'Transfer In'
        OPENING_STOCK    = 'opening_stock', 'Opening Stock'
        DAMAGE_WRITE_OFF = 'damage_write_off', 'Damage Write-Off'
        COUNT_CORRECTION = 'count_correction', 'Count Correction'

    class ReferenceType(models.TextChoices):
        SALES_TRANSACTION = 'sales_transaction', 'Sales Transaction'
        SALES_RETURN      = 'sales_return', 'Sales Return'
        PURCHASE_ORDER    = 'purchase_order', 'Purchase Order'
        STOCK_ADJUSTMENT  = 'stock_adjustment', 'Stock Adjustment'
        STOCK_TRANSFER    = 'stock_transfer', 'Stock Transfer'
        MANUAL            = 'manual', 'Manual'

    product_variant = models.ForeignKey('catalog.ProductVariant',
                                         on_delete=models.PROTECT)
    warehouse       = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    movement_type   = models.CharField(max_length=30, choices=MovementType.choices)
    reference_type  = models.CharField(max_length=30, choices=ReferenceType.choices)
    reference_id    = models.BigIntegerField()
    qty_before      = models.DecimalField(max_digits=12, decimal_places=4)
    qty_change      = models.DecimalField(max_digits=12, decimal_places=4)
    qty_after       = models.DecimalField(max_digits=12, decimal_places=4)
    unit_cost       = models.DecimalField(max_digits=14, decimal_places=6,
                                          null=True, blank=True)
    notes           = models.TextField(null=True, blank=True)
    performed_by    = models.ForeignKey(settings.AUTH_USER_MODEL,
                                         on_delete=models.PROTECT)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        # IMMUTABLE — never update rows in this table
        indexes  = [
            models.Index(fields=['product_variant', 'warehouse', '-created_at'],
                         name='idx_stock_movements_product_date'),
            models.Index(fields=['reference_type', 'reference_id'],
                         name='idx_stock_movements_ref'),
            models.Index(fields=['movement_type'],
                         name='idx_stock_movements_type'),
        ]
```

### 5.3 `pos` App — SalesTransaction (Key Table)

```python
# pos/models.py
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel

class SalesTransaction(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING            = 'pending',             'Pending'
        COMPLETED          = 'completed',           'Completed'
        VOIDED             = 'voided',              'Voided'
        REFUNDED           = 'refunded',            'Refunded'
        PARTIALLY_REFUNDED = 'partially_refunded',  'Partially Refunded'

    transaction_number = models.CharField(max_length=30, unique=True)
    cash_session       = models.ForeignKey('pos.CashSession', on_delete=models.PROTECT)
    pos_terminal       = models.ForeignKey('pos.PosTerminal', on_delete=models.PROTECT)
    warehouse          = models.ForeignKey('inventory.Warehouse', on_delete=models.PROTECT)
    customer           = models.ForeignKey('customers.Customer', null=True, blank=True,
                                            on_delete=models.SET_NULL)
    cashier            = models.ForeignKey(
                             settings.AUTH_USER_MODEL,
                             on_delete=models.PROTECT,
                             related_name='transactions_as_cashier'
                         )
    status           = models.CharField(max_length=25, choices=Status.choices,
                                         default=Status.PENDING)
    transaction_date = models.DateTimeField(auto_now_add=True)
    subtotal         = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    discount_amount  = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    taxable_amount   = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    tax_amount       = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    total_amount     = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    amount_tendered  = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    change_given     = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    voided_at        = models.DateTimeField(null=True, blank=True)
    voided_by        = models.ForeignKey(
                           settings.AUTH_USER_MODEL, null=True, blank=True,
                           on_delete=models.SET_NULL,
                           related_name='voided_transactions'
                       )
    void_reason      = models.CharField(max_length=300, null=True, blank=True)

    class Meta:
        db_table = 'sales_transactions'
        indexes  = [
            models.Index(fields=['warehouse', 'transaction_date', 'status'],
                         name='idx_sales_txn_reporting'),
            models.Index(fields=['status'],
                         name='idx_sales_txn_status'),
        ]
```

---

## 6. Replacing Triggers with Django Signals & Services

MySQL triggers → Django **Signals** + **service functions**. More testable, debuggable,
and Pythonic — and avoids database lock-in.

### 6.1 Inventory Deduction on Sale (replaces `trg_sti_after_insert`)

```python
# pos/signals.py
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SalesTransactionItem
from inventory.models import InventoryStock, StockMovement

@receiver(post_save, sender=SalesTransactionItem)
def deduct_inventory_on_sale(sender, instance, created, **kwargs):
    if not created:
        return  # Only fire on INSERT, not UPDATE

    txn = instance.sales_transaction

    with transaction.atomic():
        # Pessimistic lock — equivalent to MySQL SELECT ... FOR UPDATE
        stock = InventoryStock.objects.select_for_update().get(
            product_variant=instance.product_variant,
            warehouse=txn.warehouse,
        )

        if stock.qty_on_hand < instance.qty:
            raise ValueError(
                f"Insufficient stock for variant {instance.product_variant.variant_sku}"
            )

        qty_before    = stock.qty_on_hand
        qty_after     = qty_before - instance.qty
        stock.qty_on_hand = qty_after
        stock.save(update_fields=['qty_on_hand', 'updated_at'])

        StockMovement.objects.create(
            product_variant = instance.product_variant,
            warehouse       = txn.warehouse,
            movement_type   = StockMovement.MovementType.SALE,
            reference_type  = StockMovement.ReferenceType.SALES_TRANSACTION,
            reference_id    = txn.id,
            qty_before      = qty_before,
            qty_change      = -instance.qty,
            qty_after       = qty_after,
            unit_cost       = instance.unit_cost,
            performed_by    = txn.cashier,
        )


# pos/apps.py
class PosConfig(AppConfig):
    name = 'pos'
    def ready(self):
        import pos.signals  # noqa — connects all signal receivers
```

### 6.2 Inventory Restoration on Return (replaces `trg_sri_after_insert`)

```python
@receiver(post_save, sender=SalesReturnItem)
def restore_inventory_on_return(sender, instance, created, **kwargs):
    if not created or not instance.restock:
        return

    ret = instance.sales_return

    with transaction.atomic():
        stock = InventoryStock.objects.select_for_update().get(
            product_variant=instance.product_variant,
            warehouse=ret.warehouse,
        )
        qty_before    = stock.qty_on_hand
        qty_after     = qty_before + instance.qty_returned
        stock.qty_on_hand = qty_after
        stock.save(update_fields=['qty_on_hand', 'updated_at'])

        StockMovement.objects.create(
            product_variant = instance.product_variant,
            warehouse       = ret.warehouse,
            movement_type   = StockMovement.MovementType.SALE_RETURN,
            reference_type  = StockMovement.ReferenceType.SALES_RETURN,
            reference_id    = ret.id,
            qty_before      = qty_before,
            qty_change      = instance.qty_returned,
            qty_after       = qty_after,
            unit_cost       = instance.unit_price,
            performed_by    = ret.cashier,
        )
```

### 6.3 Price History Tracking (replaces `trg_pv_price_history`)

```python
# catalog/signals.py
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import ProductVariant
from pricing.models import ProductPriceHistory

@receiver(pre_save, sender=ProductVariant)
def track_price_change(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip on create

    try:
        old = ProductVariant.objects.get(pk=instance.pk)
    except ProductVariant.DoesNotExist:
        return

    if old.selling_price != instance.selling_price and instance.selling_price is not None:
        # Set instance._changed_by = request.user in your service/viewset before saving
        changed_by = getattr(instance, '_changed_by', None)
        ProductPriceHistory.objects.create(
            product_variant = instance,
            old_price       = old.selling_price or 0,
            new_price       = instance.selling_price,
            changed_by      = changed_by,
            effective_date  = timezone.now().date(),
        )
```

> **Tip:** Pass `variant._changed_by = request.user` in your viewset/service before
> calling `variant.save()`. This replaces the MySQL session variable `@current_user_id`.

### 6.4 Complete Sale Service (replaces `sp_complete_sale`)

```python
# pos/services.py
from django.db import transaction as db_transaction
from django.utils import timezone

def complete_sale(transaction_id: int, amount_tendered, payment_method_id: int,
                  performed_by) -> dict:
    from .models import SalesTransaction, TransactionPayment
    from invoices.services import generate_invoice

    with db_transaction.atomic():
        txn = (
            SalesTransaction.objects
            .select_for_update()
            .select_related('cash_session')
            .get(pk=transaction_id, status=SalesTransaction.Status.PENDING)
        )

        if txn.cash_session.status != 'open':
            raise ValueError("Cash session is not open.")

        if amount_tendered < txn.total_amount:
            raise ValueError("Insufficient payment amount.")

        change_given         = amount_tendered - txn.total_amount
        txn.status           = SalesTransaction.Status.COMPLETED
        txn.amount_tendered  = amount_tendered
        txn.change_given     = change_given
        txn.save(update_fields=['status', 'amount_tendered', 'change_given', 'updated_at'])

        TransactionPayment.objects.create(
            sales_transaction_id = txn.id,
            payment_method_id    = payment_method_id,
            amount               = amount_tendered,
        )

        invoice = generate_invoice(txn.id, 'sales_invoice', performed_by)

    return {'change_given': change_given, 'invoice_id': invoice.id}
```

---

## 7. PostgreSQL-Specific Enhancements

### 7.1 GIN Index on `attributes` JSONB

Add this to a migration for `ProductVariant` after the initial table creation:

```python
# catalog/migrations/xxxx_add_gin_index_attributes.py
from django.contrib.postgres.indexes import GinIndex
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [('catalog', 'xxxx_productvariant')]

    operations = [
        migrations.AddIndex(
            model_name='productvariant',
            index=GinIndex(fields=['attributes'], name='idx_pv_attributes_gin'),
        ),
    ]
```

### 7.2 `GeneratedField` for Margin/Markup (Django 6)

If you want margin/markup stored in the DB (not just computed in Python):

```python
from django.db.models import GeneratedField, ExpressionWrapper, F, DecimalField
from django.db.models.functions import Round, NullIf

# In ProductVariant:
margin_pct = GeneratedField(
    expression=Round(
        ExpressionWrapper(
            (F('selling_price') - F('cost_price'))
            / NullIf(F('selling_price'), 0) * 100,
            output_field=DecimalField(max_digits=8, decimal_places=4)
        ),
        precision=4
    ),
    output_field=DecimalField(max_digits=8, decimal_places=4),
    db_persist=True,   # STORED in PostgreSQL (equivalent to MySQL STORED generated)
)
```

### 7.3 `AuditlogMiddleware` for IP Tracking

```python
# config/settings.py — add to MIDDLEWARE:
'auditlog.middleware.AuditlogMiddleware',
```

This middleware automatically associates the requesting user and remote IP with every
logged model change — no manual tracking needed.

---

## 8. Index Strategy

All indexes are declared in `Meta.indexes` so Django manages them via migrations.
Key indexes per query pattern:

| Query Pattern | Index | Model |
|---|---|---|
| Barcode scan at POS (sub-ms) | unique on `barcode` | `ProductBarcode` |
| Stock check before sale | unique on `(product_variant, warehouse)` | `InventoryStock` |
| Daily sales report | `(warehouse, transaction_date, status)` | `SalesTransaction` |
| Low-stock alert | `(warehouse, qty_on_hand, reorder_point)` | `InventoryStock` |
| Vehicle fitment search | `(vehicle_year, product)` | `ProductVehicleFitment` |
| Customer search at POS | `(phone, is_active)` | `Customer` |
| Stock movement history | `(product_variant, warehouse, -created_at)` | `StockMovement` |
| Price history by product | `(product_variant, effective_date DESC)` | `ProductPriceHistory` |
| Supplier cost trends | `(supplier, effective_date DESC)` | `SupplierCostHistory` |
| Tier price resolution | `(product_variant, price_tier, min_qty, effective_date)` | `ProductPriceTierRule` |
| Margin reporting | `(margin_pct, is_active)` | `ProductVariant` |
| JSONB attribute lookups | GIN index on `attributes` | `ProductVariant` |

---

## 9. Audit Logging with django-auditlog

`django-auditlog` (already in `requirements.txt`) automates the `audit_log` pattern.
Register any model you want fully audited:

```python
# catalog/models.py
from auditlog.registry import auditlog

auditlog.register(Product)
auditlog.register(ProductVariant)

# inventory/models.py
auditlog.register(InventoryStock)
auditlog.register(StockAdjustment)

# pos/models.py
auditlog.register(SalesTransaction)
```

`django-auditlog` captures `INSERT`, `UPDATE`, and `DELETE` with `old_values` and
`new_values` as JSON, plus `actor` (user) and remote IP when `AuditlogMiddleware` is
active. This replaces the `audit_log` table design entirely.

---

## 10. Migration Order & Phased Rollout

Follow this order strictly — foreign key dependencies must be respected.

### Phase 1 — Foundation (Week 1)
- [ ] Create `core` app with `TimeStampedModel` and `SoftDeleteModel`
- [ ] Extend `authentication.User` with POS fields (`phone`, `pin_hash`, `warehouse`, `deleted_at`)
- [ ] Add custom JWT claim serializer (embed `roles` + `warehouse_id` in token)
- [ ] Create `catalog` app: `Brand`, `Category`, `UnitOfMeasure`, `TaxRate`
- [ ] Create `vehicles` app: `VehicleMake`, `VehicleModel`, `VehicleYear`
- [ ] Run first migrations

### Phase 2 — Products & Inventory (Week 2)
- [ ] Create `inventory` app: `Warehouse`
- [ ] Add `Product`, `ProductVariant`, `ProductBarcode` to `catalog`
- [ ] Add `ProductVehicleFitment` to `vehicles`
- [ ] Add `InventoryStock`, `StockMovement`, `StockAdjustment` to `inventory`
- [ ] Wire `post_save` signal for inventory deduction
- [ ] Add GIN index migration on `ProductVariant.attributes`

### Phase 3 — Procurement (Week 3)
- [ ] Create `procurement` app: `Supplier`, `SupplierProduct`, `PurchaseOrder`, `PurchaseOrderItem`
- [ ] Wire `post_save` signal for inventory addition on PO receipt

### Phase 4 — POS & Sales (Week 4)
- [ ] Create `pos` app: `PosTerminal`, `CashSession`, `Discount`, `SalesTransaction`,
  `SalesTransactionItem`, `PaymentMethod`, `TransactionPayment`, `SalesReturn`, `SalesReturnItem`
- [ ] Implement `complete_sale()` service
- [ ] Wire inventory deduction and restoration signals

### Phase 5 — Customers, Invoices & Pricing (Week 5)
- [ ] Create `customers` app: `Customer`, `CustomerAddress`
- [ ] Create `invoices` app: `InvoiceSequence`, `BusinessProfile`, `Invoice`,
  `InvoiceItem`, `InvoicePayment`
- [ ] Implement `generate_invoice()` service
- [ ] Create `pricing` app: `PriceTier`, `ProductPriceTierRule`,
  `ProductPriceHistory`, `SupplierCostHistory`
- [ ] Wire price change and supplier cost change signals

### Phase 6 — Polish & Performance (Week 6)
- [ ] Add `AuditlogMiddleware` and register models with `django-auditlog`
- [ ] Write seed data management commands (price tiers, UOMs, payment methods)
- [ ] Validate indexes with `EXPLAIN ANALYZE` on all critical queries
- [ ] Load test concurrent POS writes (`select_for_update` under multi-terminal load)
- [ ] Add Celery tasks for low-stock alerts and async invoice PDF generation

---

## 11. New Package Dependencies

Add to `requirements.txt`:

```
# Already present
Django==6.0.2
djangorestframework==3.16.1
djangorestframework-simplejwt==5.5.1
psycopg2-binary==2.9.11
django-auditlog==3.4.1

# Add these
django-filter==25.1        # DRF filtering for list endpoints
django-extensions==4.1     # shell_plus, RunScript for dev productivity
celery==5.4.0              # Async tasks (low-stock alerts, invoice emails, PDF gen)
redis==5.2.1               # Celery broker + cache backend
django-redis==5.4.0        # Django cache integration with Redis
```

> **Tip:** Celery + Redis is strongly recommended. Low-stock alert emails, async invoice
> PDF generation, and background PO status updates should NOT block POS transactions.

---

## 12. Checklist Summary

| # | Task | App | Priority |
|---|------|-----|----------|
| 1 | Extend `User` model with POS fields | `authentication` | Critical |
| 2 | Custom JWT claims (roles, warehouse_id) | `authentication` | Critical |
| 3 | Create `core` base models | `core` | Critical |
| 4 | `Brand`, `Category`, `UnitOfMeasure`, `TaxRate` | `catalog` | Critical |
| 5 | `Product`, `ProductVariant`, `ProductBarcode` | `catalog` | Critical |
| 6 | Vehicle compatibility tables | `vehicles` | High |
| 7 | `Warehouse`, `InventoryStock`, `StockMovement` | `inventory` | Critical |
| 8 | Inventory deduction signal (sale) | `pos` | Critical |
| 9 | Inventory restoration signal (return) | `pos` | Critical |
| 10 | `Supplier`, `PurchaseOrder` tables | `procurement` | High |
| 11 | PO receipt inventory update signal | `procurement` | High |
| 12 | Full POS transaction tables | `pos` | Critical |
| 13 | `complete_sale()` service | `pos` | Critical |
| 14 | Invoice generation service | `invoices` | High |
| 15 | Price tier & history tables | `pricing` | Medium |
| 16 | Price change signal | `catalog` / `pricing` | Medium |
| 17 | GIN index on `attributes` JSONB | `catalog` | Medium |
| 18 | All composite indexes in `Meta.indexes` | All apps | High |
| 19 | `django-auditlog` registration + middleware | All apps | High |
| 20 | Celery async tasks (alerts, PDF invoices) | All apps | Medium |

---

*This document should evolve as implementation progresses.*

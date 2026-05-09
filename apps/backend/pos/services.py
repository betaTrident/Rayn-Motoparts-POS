from decimal import Decimal

from django.db import IntegrityError
from django.db import transaction as db_transaction
from django.utils import timezone

from core.models import AuditLog
from core.rollout_flags import (
    assert_write_enabled,
    dual_write_enabled,
    pos_receipt_dual_write_enabled,
)
from inventory.models import InventoryStock, get_default_warehouse

from .receipt_dual_write import ensure_receipt_dual_write_snapshot


def complete_sale(transaction_id: int, amount_tendered, payment_method_id: int, performed_by) -> dict:
    from .models import CashSession, SalesTransaction, TransactionPayment

    assert_write_enabled()

    with db_transaction.atomic():
        txn = (
            SalesTransaction.objects.select_for_update()
            .select_related('cash_session')
            .get(pk=transaction_id, status=SalesTransaction.Status.PENDING)
        )

        if txn.cash_session.status != CashSession.Status.OPEN:
            raise ValueError('Cash session is not open.')

        if amount_tendered < txn.total_amount:
            raise ValueError('Insufficient payment amount.')

        change_given = amount_tendered - txn.total_amount
        txn.status = SalesTransaction.Status.COMPLETED
        txn.amount_tendered = amount_tendered
        txn.change_given = change_given
        txn.save(update_fields=['status', 'amount_tendered', 'change_given', 'updated_at'])

        TransactionPayment.objects.create(
            sales_transaction_id=txn.id,
            payment_method_id=payment_method_id,
            amount=amount_tendered,
        )

        if pos_receipt_dual_write_enabled():
            ensure_receipt_dual_write_snapshot(txn=txn, performed_by=performed_by)
        elif dual_write_enabled():
            # Keep a lightweight marker for environments that enable global dual-write
            # without receipt snapshot persistence.
            AuditLog.objects.create(
                table_name='sales_transactions',
                record_pk=str(txn.id),
                action=AuditLog.Action.UPDATE,
                changed_by=performed_by,
                new_values={
                    'dual_write_marker': True,
                    'status': txn.status,
                    'amount_tendered': str(amount_tendered),
                    'payment_method_id': payment_method_id,
                },
            )

    return {
        'change_given': change_given,
        'transaction_id': txn.id,
        'performed_by_id': performed_by.id,
    }


def _generate_transaction_number() -> str:
    from .models import SalesTransaction

    prefix = timezone.localdate().strftime("TXN-%Y%m%d-")
    latest = (
        SalesTransaction.objects.select_for_update()
        .filter(transaction_number__startswith=prefix)
        .order_by("-transaction_number")
        .first()
    )
    next_sequence = 1
    if latest is not None:
        try:
            next_sequence = int(latest.transaction_number.rsplit("-", 1)[1]) + 1
        except (IndexError, ValueError):
            next_sequence = 1
    return f"{prefix}{next_sequence:04d}"


def _generate_cash_session_code() -> str:
    from .models import CashSession

    prefix = timezone.localdate().strftime("CS-%Y%m%d-")
    latest = (
        CashSession.objects.select_for_update()
        .filter(session_code__startswith=prefix)
        .order_by("-session_code")
        .first()
    )
    next_sequence = 1
    if latest is not None and latest.session_code:
        try:
            next_sequence = int(latest.session_code.rsplit("-", 1)[1]) + 1
        except (IndexError, ValueError):
            next_sequence = 1
    return f"{prefix}{next_sequence:04d}"


def open_cash_session(*, cashier, opening_balance) -> tuple[object, bool]:
    from .models import CashSession

    assert_write_enabled()
    get_default_warehouse()

    with db_transaction.atomic():
        existing_session = (
            CashSession.objects.select_for_update()
            .filter(cashier=cashier, status=CashSession.Status.OPEN)
            .order_by("-opened_at")
            .first()
        )
        if existing_session is not None:
            return existing_session, False

        created_session = None
        for _ in range(5):
            session_code = _generate_cash_session_code()
            try:
                with db_transaction.atomic():
                    created_session = CashSession.objects.create(
                        session_code=session_code,
                        cashier=cashier,
                        status=CashSession.Status.OPEN,
                        opening_balance=opening_balance,
                    )
                break
            except IntegrityError:
                continue

        if created_session is None:
            raise ValueError("Unable to generate a unique cash session code. Please retry.")

        return created_session, True


def create_and_complete_sale(
    *,
    cash_session_id: int,
    cashier,
    customer=None,
    customer_name: str | None = None,
    items: list[dict],
    payments: list[dict],
    notes: str | None = None,
) -> dict:
    from catalog.models import ProductVariant

    from .models import CashSession, PaymentMethod, SalesTransaction, SalesTransactionItem, TransactionPayment

    assert_write_enabled()

    if not items:
        raise ValueError("At least one item is required.")
    if len(payments) != 1:
        raise ValueError("Exactly one payment is required.")

    payment_input = payments[0]

    with db_transaction.atomic():
        warehouse = get_default_warehouse()
        cash_session = (
            CashSession.objects.select_for_update()
            .filter(pk=cash_session_id, cashier=cashier)
            .first()
        )
        if cash_session is None:
            raise ValueError("Cash session not found for the current cashier.")
        if cash_session.status != CashSession.Status.OPEN:
            raise ValueError("Cash session is not open.")

        payment_method = (
            PaymentMethod.objects.select_for_update()
            .filter(pk=payment_input["payment_method_id"], is_active=True)
            .first()
        )
        if payment_method is None:
            raise ValueError("Payment method is inactive or invalid.")

        variant_ids = [item["variant_id"] for item in items]
        variants = {
            variant.id: variant
            for variant in ProductVariant.objects.select_related("product__tax_rate")
            .filter(id__in=variant_ids, deleted_at__isnull=True, is_active=True, product__is_active=True)
        }
        if len(variants) != len(set(variant_ids)):
            raise ValueError("One or more products are unavailable for sale.")

        stocks = {
            stock.product_variant_id: stock
            for stock in InventoryStock.objects.select_for_update().filter(
                product_variant_id__in=variant_ids,
                warehouse=warehouse,
            )
        }
        for variant_id, variant in variants.items():
            if variant_id in stocks:
                continue
            stock, _ = InventoryStock.objects.select_for_update().get_or_create(
                product_variant_id=variant_id,
                warehouse=warehouse,
                defaults={"avg_cost": variant.effective_cost or Decimal("0")},
            )
            stocks[variant_id] = stock

        requested_qty_by_variant: dict[int, Decimal] = {}
        for item in items:
            requested_qty_by_variant[item["variant_id"]] = requested_qty_by_variant.get(
                item["variant_id"], Decimal("0")
            ) + item["qty"]

        for variant_id, requested_qty in requested_qty_by_variant.items():
            stock = stocks.get(variant_id)
            variant = variants[variant_id]
            if stock.qty_available < requested_qty:
                raise ValueError(
                    f"Insufficient stock for {variant.product.name} ({variant.variant_sku})."
                )

        transaction_obj = None
        for _ in range(5):
            transaction_number = _generate_transaction_number()
            try:
                with db_transaction.atomic():
                    transaction_obj = SalesTransaction.objects.create(
                        transaction_number=transaction_number,
                        warehouse=warehouse,
                        cash_session=cash_session,
                        customer=customer,
                        cashier=cashier,
                        customer_name=customer_name or None,
                        status=SalesTransaction.Status.PENDING,
                    )
                break
            except IntegrityError:
                continue
        if transaction_obj is None:
            raise ValueError("Unable to generate a unique transaction number. Please retry.")

        line_items: list[SalesTransactionItem] = []
        subtotal = Decimal("0")
        discount_amount = Decimal("0")
        tax_amount = Decimal("0")
        total_amount = Decimal("0")
        for item in items:
            variant = variants[item["variant_id"]]
            unit_price = variant.effective_price or Decimal("0")
            unit_cost = variant.effective_cost or Decimal("0")
            item_tax_rate = (
                variant.product.tax_rate.rate if getattr(variant.product, "is_taxable", False) else Decimal("0")
            )
            line = SalesTransactionItem.objects.create(
                sales_transaction=transaction_obj,
                product_variant=variant,
                qty=item["qty"],
                unit_price=unit_price,
                unit_cost=unit_cost,
                tax_rate=item_tax_rate,
                discount_type=item.get("discount_type"),
                discount_value=item.get("discount_value"),
            )
            line_items.append(line)
            subtotal += line.line_subtotal
            discount_amount += line.discount_amount
            tax_amount += line.line_tax_amount
            total_amount += line.line_total

        amount_tendered = payment_input["amount"]
        if amount_tendered < total_amount:
            raise ValueError("Insufficient payment amount.")

        if payment_method.code.upper() != "CASH" and amount_tendered != total_amount:
            raise ValueError("Non-cash payments must match the exact total amount.")

        change_given = amount_tendered - total_amount
        transaction_obj.subtotal = subtotal
        transaction_obj.discount_amount = discount_amount
        transaction_obj.taxable_amount = subtotal
        transaction_obj.tax_amount = tax_amount
        transaction_obj.total_amount = total_amount
        transaction_obj.amount_tendered = amount_tendered
        transaction_obj.change_given = change_given
        transaction_obj.status = SalesTransaction.Status.COMPLETED
        transaction_obj.save(
            update_fields=[
                "subtotal",
                "discount_amount",
                "taxable_amount",
                "tax_amount",
                "total_amount",
                "amount_tendered",
                "change_given",
                "status",
                "updated_at",
            ]
        )

        TransactionPayment.objects.create(
            sales_transaction=transaction_obj,
            payment_method=payment_method,
            amount=amount_tendered,
            reference_number=payment_input.get("reference_number") or None,
        )

        receipt = None
        if pos_receipt_dual_write_enabled():
            receipt, _ = ensure_receipt_dual_write_snapshot(txn=transaction_obj, performed_by=cashier)
        elif dual_write_enabled():
            AuditLog.objects.create(
                table_name="sales_transactions",
                record_pk=str(transaction_obj.id),
                action=AuditLog.Action.INSERT,
                changed_by=cashier,
                new_values={
                    "dual_write_marker": True,
                    "status": transaction_obj.status,
                    "notes": notes or "",
                },
            )

    return {
        "transaction": {
            "id": transaction_obj.id,
            "transactionNumber": transaction_obj.transaction_number,
            "status": transaction_obj.status,
            "customerName": transaction_obj.customer_name,
            "subtotal": float(transaction_obj.subtotal),
            "discountAmount": float(transaction_obj.discount_amount),
            "taxAmount": float(transaction_obj.tax_amount),
            "totalAmount": float(transaction_obj.total_amount),
            "amountTendered": float(transaction_obj.amount_tendered),
            "changeGiven": float(transaction_obj.change_given),
        },
        "receiptSnapshotEnabled": pos_receipt_dual_write_enabled(),
        "receipt": (
            {
                "id": receipt.id,
                "receiptNumber": receipt.receipt_number,
            }
            if receipt is not None
            else None
        ),
    }

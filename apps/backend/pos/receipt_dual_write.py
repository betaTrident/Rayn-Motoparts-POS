from __future__ import annotations

from django.db import IntegrityError

from core.models import AuditLog

from .models import (
    BusinessProfile,
    Receipt,
    ReceiptItem,
    ReceiptPayment,
    ReceiptSequence,
)


def _compose_seller_address(profile: BusinessProfile | None) -> str:
    if profile is None:
        return 'N/A'

    parts = [
        profile.address_line1,
        profile.address_line2,
        profile.city,
        profile.province,
        profile.zip_code,
    ]
    return ', '.join([p for p in parts if p]) or 'N/A'


def _next_receipt_number(sequence: ReceiptSequence) -> tuple[int, str]:
    next_number = max(sequence.current_number + 1, sequence.start_number)
    prefix = sequence.prefix if sequence.prefix else f'{sequence.series_code}-'

    while True:
        receipt_number = f'{prefix}{str(next_number).zfill(sequence.zero_pad)}'
        if not Receipt.objects.filter(receipt_number=receipt_number).exists():
            return next_number, receipt_number
        next_number += 1


def ensure_receipt_dual_write_snapshot(txn, performed_by) -> tuple[Receipt, bool]:
    existing = Receipt.objects.filter(sales_transaction=txn).first()
    if existing is not None:
        return existing, False

    profile = BusinessProfile.objects.order_by('id').first()

    sequence = (
        ReceiptSequence.objects.select_for_update()
        .filter(is_active=True)
        .order_by('id')
        .first()
    )
    if sequence is None:
        sequence = ReceiptSequence.objects.create(
            series_code='OR',
            series_label='Official Receipt',
            prefix='OR-',
            current_number=0,
            zero_pad=6,
            start_number=1,
            is_active=True,
        )

    next_number, receipt_number = _next_receipt_number(sequence)

    customer = txn.customer
    if customer is not None:
        customer_name = f'{customer.first_name} {customer.last_name or ""}'.strip()
    else:
        customer_name = None
    buyer_name = txn.customer_name or customer_name or 'Walk-in Customer'

    receipt_defaults = {
        'receipt_number': receipt_number,
        'receipt_sequence': sequence,
        'customer': customer,
        'buyer_name': buyer_name,
        'buyer_address': None,
        'buyer_tin': None,
        'buyer_phone': customer.phone if customer else None,
        'seller_name': profile.business_name if profile else 'Rayn Motoparts POS',
        'seller_address': _compose_seller_address(profile),
        'seller_tin': profile.tin if profile else None,
        'seller_phone': profile.phone if profile else None,
        'subtotal': txn.subtotal,
        'taxable_amount': txn.taxable_amount,
        'tax_amount': txn.tax_amount,
        'total_amount': txn.total_amount,
        'amount_paid': txn.amount_tendered,
        'change_given': txn.change_given,
        'created_by': performed_by,
    }

    try:
        receipt = Receipt.objects.create(
            sales_transaction=txn,
            **receipt_defaults,
        )
    except IntegrityError:
        # A concurrent writer may have created the receipt first.
        concurrent = Receipt.objects.filter(sales_transaction=txn).first()
        if concurrent is None:
            raise
        return concurrent, False

    sequence.current_number = next_number
    sequence.save(update_fields=['current_number'])

    for line_number, item in enumerate(txn.items.select_related('product_variant__product').all(), start=1):
        product_name = item.product_variant.product.name
        variant_name = item.product_variant.variant_name
        description = product_name if not variant_name else f'{product_name} - {variant_name}'
        ReceiptItem.objects.create(
            receipt=receipt,
            line_number=line_number,
            product_variant=item.product_variant,
            sku=item.product_variant.variant_sku,
            description=description,
            unit_of_measure='pcs',
            qty=item.qty,
            unit_price=item.unit_price,
            tax_amount=item.line_tax_amount,
            line_total=item.line_total,
        )

    for payment in txn.payments.select_related('payment_method').all():
        ReceiptPayment.objects.create(
            receipt=receipt,
            payment_method=payment.payment_method,
            payment_method_name=payment.payment_method.name,
            amount=payment.amount,
            reference_number=payment.reference_number,
        )

    AuditLog.objects.create(
        table_name='receipts',
        record_pk=str(receipt.id),
        action=AuditLog.Action.INSERT,
        changed_by=performed_by,
        new_values={
            'dual_write_marker': True,
            'source_transaction_id': txn.id,
            'receipt_number': receipt.receipt_number,
            'line_count': receipt.items.count(),
            'payment_count': receipt.payments.count(),
        },
    )

    return receipt, True

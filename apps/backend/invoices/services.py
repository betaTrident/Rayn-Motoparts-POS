from django.db import transaction

from .models import Invoice, InvoiceItem, InvoicePayment, InvoiceSequence


def _next_invoice_number(invoice_type: str) -> str:
    sequence, _ = InvoiceSequence.objects.select_for_update().get_or_create(
        invoice_type=invoice_type,
        defaults={'prefix': 'INV', 'current_value': 0},
    )
    sequence.current_value += 1
    sequence.save(update_fields=['current_value', 'updated_at'])
    return f"{sequence.prefix}-{sequence.current_value:08d}"


def generate_invoice(sales_transaction_id: int, invoice_type: str, performed_by):
    from pos.models import SalesTransaction

    with transaction.atomic():
        txn = (
            SalesTransaction.objects.select_for_update()
            .select_related('warehouse')
            .prefetch_related('items', 'payments')
            .get(pk=sales_transaction_id)
        )

        invoice_number = _next_invoice_number(invoice_type)
        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            invoice_type=invoice_type,
            sales_transaction=txn,
            customer=txn.customer,
            warehouse=txn.warehouse,
            issued_by=performed_by,
            subtotal=txn.subtotal,
            discount_amount=txn.discount_amount,
            tax_amount=txn.tax_amount,
            total_amount=txn.total_amount,
        )

        items = []
        for item in txn.items.all():
            items.append(
                InvoiceItem(
                    invoice=invoice,
                    product_variant=item.product_variant,
                    qty=item.qty,
                    unit_price=item.unit_price,
                    tax_rate=item.tax_rate,
                    discount_amount=item.discount_amount,
                    line_total=item.line_total,
                )
            )
        InvoiceItem.objects.bulk_create(items)

        payments = []
        for payment in txn.payments.all():
            payments.append(
                InvoicePayment(
                    invoice=invoice,
                    payment_method=payment.payment_method,
                    amount=payment.amount,
                    reference_number=payment.reference_number,
                )
            )
        if payments:
            InvoicePayment.objects.bulk_create(payments)

    return invoice

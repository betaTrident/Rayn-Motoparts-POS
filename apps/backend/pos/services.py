from django.db import transaction as db_transaction


def complete_sale(transaction_id: int, amount_tendered, payment_method_id: int, performed_by) -> dict:
    from .models import CashSession, SalesTransaction, TransactionPayment
    from invoices.services import generate_invoice

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

        invoice = generate_invoice(
            sales_transaction_id=txn.id,
            invoice_type='sales_invoice',
            performed_by=performed_by,
        )

    return {
        'change_given': change_given,
        'transaction_id': txn.id,
        'invoice_id': invoice.id,
        'performed_by_id': performed_by.id,
    }

from django.db import transaction as db_transaction

from core.models import AuditLog
from core.rollout_flags import (
    assert_write_enabled,
    dual_write_enabled,
    pos_receipt_dual_write_enabled,
)

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

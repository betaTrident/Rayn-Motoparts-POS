from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q, Sum
from django.db.models.functions import Coalesce

from core.rollout_flags import pos_receipt_dual_write_enabled, reconciliation_enabled
from inventory.models import InventoryStock, StockMovement
from pos.models import Receipt, SalesTransaction


class Command(BaseCommand):
    help = 'Phase 3 reconciliation report: sales totals, payments, and stock consistency checks.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fail-on-issues',
            action='store_true',
            help='Exit with non-zero status if reconciliation finds any issues.',
        )

    def handle(self, *args, **options):
        fail_on_issues = options['fail_on_issues']

        if not reconciliation_enabled():
            self.stdout.write(
                self.style.WARNING(
                    'DB_V2_RECONCILIATION_ENABLED is false. Running report in passive mode.'
                )
            )

        completed_statuses = [
            SalesTransaction.Status.COMPLETED,
            SalesTransaction.Status.PARTIALLY_REFUNDED,
        ]

        txns = SalesTransaction.objects.filter(status__in=completed_statuses).prefetch_related(
            'items',
            'payments',
        )

        total_txns = txns.count()
        item_total_mismatch = 0
        payment_total_short = 0

        for txn in txns.iterator(chunk_size=200):
            item_total = sum((item.line_total for item in txn.items.all()), Decimal('0'))
            if item_total != txn.total_amount:
                item_total_mismatch += 1

            paid = sum((p.amount for p in txn.payments.all()), Decimal('0'))
            if paid < txn.total_amount:
                payment_total_short += 1

        negative_stock_rows = InventoryStock.objects.filter(qty_on_hand__lt=0).count()

        sale_movements = StockMovement.objects.filter(
            movement_type=StockMovement.MovementType.SALE,
            reference_type=StockMovement.ReferenceType.SALES_TRANSACTION,
        )
        sale_movement_count = sale_movements.count()

        sale_qty_net = sale_movements.aggregate(
            v=Coalesce(Sum('qty_change'), Decimal('0'))
        )['v']

        orphan_sale_movements = StockMovement.objects.filter(
            movement_type=StockMovement.MovementType.SALE,
            reference_type=StockMovement.ReferenceType.SALES_TRANSACTION,
        ).exclude(reference_id__in=SalesTransaction.objects.values('id')).count()

        receipt_missing = 0
        receipt_total_mismatch = 0
        receipt_payment_mismatch = 0

        if pos_receipt_dual_write_enabled():
            for txn in txns.iterator(chunk_size=200):
                receipt = Receipt.objects.filter(sales_transaction=txn).prefetch_related('payments').first()
                if receipt is None:
                    receipt_missing += 1
                    continue

                if receipt.total_amount != txn.total_amount:
                    receipt_total_mismatch += 1

                receipt_paid = sum((p.amount for p in receipt.payments.all()), Decimal('0'))
                if receipt_paid != receipt.amount_paid:
                    receipt_payment_mismatch += 1

        self.stdout.write(self.style.MIGRATE_HEADING('Phase 3 Reconciliation Report'))
        self.stdout.write(f'Completed/partially-refunded transactions scanned: {total_txns}')
        self.stdout.write(f'Item-total mismatches: {item_total_mismatch}')
        self.stdout.write(f'Payment shortfalls: {payment_total_short}')
        self.stdout.write(f'Negative inventory rows: {negative_stock_rows}')
        self.stdout.write(f'Sale stock movement rows: {sale_movement_count}')
        self.stdout.write(f'Net sale qty_change (should be <= 0): {sale_qty_net}')
        self.stdout.write(f'Orphan sale movement references: {orphan_sale_movements}')
        self.stdout.write(f'Missing receipt snapshots: {receipt_missing}')
        self.stdout.write(f'Receipt-vs-transaction total mismatches: {receipt_total_mismatch}')
        self.stdout.write(f'Receipt payment-vs-paid mismatches: {receipt_payment_mismatch}')

        issues = (
            item_total_mismatch
            + payment_total_short
            + negative_stock_rows
            + orphan_sale_movements
            + receipt_missing
            + receipt_total_mismatch
            + receipt_payment_mismatch
        )
        if issues == 0:
            self.stdout.write(self.style.SUCCESS('Reconciliation passed with zero detected issues.'))
        else:
            message = (
                f'Reconciliation found {issues} issue(s). '
                'Resolve before enabling hard cutover.'
            )
            self.stdout.write(self.style.WARNING(message))
            if fail_on_issues:
                raise CommandError(
                    f'Fail-on-issues enabled: {message}'
                )

from django.core.management.base import BaseCommand
from django.db import transaction

from pos.models import CashSession, SalesTransaction


class Command(BaseCommand):
    help = (
        "Backfill CashSession.session_code and decouple legacy pos_terminal links "
        "from cash_sessions/sales_transactions (idempotent)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview and rollback all updates.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 3 POS Terminal Decouple Backfill"))
        self.stdout.write(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")

        session_updates = self._backfill_session_codes()
        detach_session_updates = self._detach_cash_session_terminals()
        detach_txn_updates = self._detach_sales_transaction_terminals()

        if dry_run:
            transaction.set_rollback(True)
            self.stdout.write(self.style.WARNING("Dry run complete. All updates rolled back."))

        self.stdout.write(self.style.SUCCESS(f"CashSession session_code updated: {session_updates}"))
        self.stdout.write(self.style.SUCCESS(f"CashSession pos_terminal detached: {detach_session_updates}"))
        self.stdout.write(self.style.SUCCESS(f"SalesTransaction pos_terminal detached: {detach_txn_updates}"))
        self.stdout.write(self.style.SUCCESS("POS terminal decouple backfill complete."))

    def _backfill_session_codes(self):
        updated = 0
        qs = CashSession.objects.filter(session_code__isnull=True).order_by("id")

        for cash_session in qs.iterator():
            generated_code = f"CS-{cash_session.opened_at:%Y%m%d}-{cash_session.id:06d}"
            cash_session.session_code = generated_code
            cash_session.save(update_fields=["session_code", "updated_at"])
            updated += 1
            self.stdout.write(f"- cash_session id={cash_session.id} session_code={generated_code}")

        return updated

    def _detach_cash_session_terminals(self):
        try:
            CashSession._meta.get_field("pos_terminal")
        except Exception:
            self.stdout.write("- cash_sessions.pos_terminal: already retired")
            return 0

        updated = 0
        qs = CashSession.objects.exclude(pos_terminal_id__isnull=True).order_by("id")

        for cash_session in qs.iterator():
            old_terminal_id = cash_session.pos_terminal_id
            cash_session.pos_terminal_id = None
            cash_session.save(update_fields=["pos_terminal", "updated_at"])
            updated += 1
            self.stdout.write(
                f"- cash_session id={cash_session.id} detached pos_terminal_id={old_terminal_id}"
            )

        return updated

    def _detach_sales_transaction_terminals(self):
        try:
            SalesTransaction._meta.get_field("pos_terminal")
        except Exception:
            self.stdout.write("- sales_transactions.pos_terminal: already retired")
            return 0

        updated = 0
        qs = SalesTransaction.objects.exclude(pos_terminal_id__isnull=True).order_by("id")

        for txn in qs.iterator():
            old_terminal_id = txn.pos_terminal_id
            txn.pos_terminal_id = None
            txn.save(update_fields=["pos_terminal", "updated_at"])
            updated += 1
            self.stdout.write(
                f"- sales_transaction id={txn.id} txn_no={txn.transaction_number} "
                f"detached pos_terminal_id={old_terminal_id}"
            )

        return updated

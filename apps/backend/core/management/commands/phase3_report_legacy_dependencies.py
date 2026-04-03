from django.core.management.base import BaseCommand
from django.db import connection

from authentication.models import User
from inventory.models import InventoryStock, StockAdjustment, StockMovement
from pos.models import CashSession, SalesReturn, SalesTransaction
from vehicles.models import ProductVehicleFitment


class Command(BaseCommand):
    help = "Report row counts and references tied to legacy retirement tables (warehouses, pos_terminals, vehicle_years)."

    def handle(self, *args, **options):
        canonical = self._resolve_canonical_warehouse_id()

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 3 Legacy Dependency Report"))
        if canonical is not None:
            self.stdout.write(f"Canonical warehouse id for non-canonical checks: {canonical}")

        sections = [
            ("warehouses", lambda: self._warehouse_section(canonical)),
            ("pos_terminals", self._pos_terminal_section),
            ("vehicle_years", self._vehicle_year_section),
        ]

        for title, fn in sections:
            self.stdout.write("")
            self.stdout.write(self.style.HTTP_INFO(f"[{title}]"))
            for line in fn():
                self.stdout.write(f"- {line}")

        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING(
                "Interpretation: non-zero references mean retirement must remain staged "
                "(freeze -> backfill -> archive -> drop)."
            )
        )

    def _resolve_canonical_warehouse_id(self):
        if not self._table_exists('warehouses'):
            return None

        with connection.cursor() as cursor:
            if self._column_exists('warehouses', 'is_pos_location'):
                cursor.execute('SELECT id FROM "warehouses" WHERE is_pos_location = TRUE ORDER BY id LIMIT 1')
                row = cursor.fetchone()
                if row:
                    return row[0]

            cursor.execute('SELECT id FROM "warehouses" ORDER BY id LIMIT 1')
            row = cursor.fetchone()
            return row[0] if row else None

    def _model_has_field(self, model, field_name):
        try:
            model._meta.get_field(field_name)
            return True
        except Exception:
            return False

    def _linked_counts(self, model, field_name, canonical_id):
        if not self._model_has_field(model, field_name):
            return 'N/A'

        linked = model.objects.exclude(**{f'{field_name}__isnull': True}).count()
        if canonical_id is None:
            return f'{linked}/N/A'

        non_canonical = model.objects.exclude(**{f'{field_name}__isnull': True}).exclude(
            **{field_name: canonical_id}
        ).count()
        return f'{linked}/{non_canonical}'

    def _warehouse_section(self, canonical_id):
        if self._table_exists('warehouses'):
            warehouse_count = str(self._count_rows('warehouses'))
        else:
            warehouse_count = 'DROPPED'

        return [
            f"warehouses rows: {warehouse_count}",
            (
                f"inventory_stock rows linked total/non-canonical: "
                f"{self._linked_counts(InventoryStock, 'warehouse', canonical_id)}"
            ),
            (
                f"stock_movements rows linked total/non-canonical: "
                f"{self._linked_counts(StockMovement, 'warehouse', canonical_id)}"
            ),
            (
                f"stock_adjustments rows linked total/non-canonical: "
                f"{self._linked_counts(StockAdjustment, 'warehouse', canonical_id)}"
            ),
            (
                f"sales_transactions rows linked total/non-canonical: "
                f"{self._linked_counts(SalesTransaction, 'warehouse', canonical_id)}"
            ),
            (
                f"sales_returns rows linked total/non-canonical: "
                f"{self._linked_counts(SalesReturn, 'warehouse', canonical_id)}"
            ),
            (
                f"users rows linked total/non-canonical: "
                f"{self._linked_counts(User, 'warehouse', canonical_id)}"
            ),
        ]

    def _pos_terminal_section(self):
        if not self._table_exists('pos_terminals'):
            return [
                "pos_terminals table: DROPPED",
                "cash_sessions rows linked: N/A",
                "sales_transactions rows linked: N/A",
            ]

        terminal_count = self._count_rows('pos_terminals')
        has_cash_session_col = self._column_exists('cash_sessions', 'pos_terminal_id')
        has_sales_txn_col = self._column_exists('sales_transactions', 'pos_terminal_id')

        cash_session_linked = (
            CashSession.objects.exclude(pos_terminal_id__isnull=True).count()
            if has_cash_session_col
            else 'N/A'
        )
        sales_txn_linked = (
            SalesTransaction.objects.exclude(pos_terminal_id__isnull=True).count()
            if has_sales_txn_col
            else 'N/A'
        )

        return [
            f"pos_terminals rows: {terminal_count}",
            f"cash_sessions rows linked: {cash_session_linked}",
            f"sales_transactions rows linked: {sales_txn_linked}",
        ]

    def _vehicle_year_section(self):
        if not self._table_exists('vehicle_years'):
            return [
                "vehicle_years table: DROPPED",
                "product_vehicle_fitments rows linked: N/A",
            ]

        year_count = self._count_rows('vehicle_years')
        has_vehicle_year_col = self._column_exists('product_vehicle_fitments', 'vehicle_year_id')
        linked_fitments = (
            ProductVehicleFitment.objects.exclude(vehicle_year_id__isnull=True).count()
            if has_vehicle_year_col
            else 'N/A'
        )

        return [
            f"vehicle_years rows: {year_count}",
            f"product_vehicle_fitments rows linked: {linked_fitments}",
        ]

    def _table_exists(self, table_name):
        return table_name in connection.introspection.table_names()

    def _column_exists(self, table_name, column_name):
        with connection.cursor() as cursor:
            columns = {col.name for col in connection.introspection.get_table_description(cursor, table_name)}
        return column_name in columns

    def _count_rows(self, table_name):
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            row = cursor.fetchone()
        return row[0] if row else 0

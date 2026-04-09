from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Phase 5 query plan snapshot using EXPLAIN for hot-path SQL checks.'

    HOT_PATH_QUERIES = {
        'barcode_lookup': (
            'SELECT pb.product_variant_id '
            'FROM product_barcodes pb '
            'WHERE pb.barcode = %s '
            'LIMIT 1',
            ['DUMMY-BARCODE'],
        ),
        'sales_reporting': (
            'SELECT st.id, st.transaction_date, st.total_amount '
            'FROM sales_transactions st '
            'WHERE st.transaction_date >= NOW() - INTERVAL \'30 days\' '
            'AND st.status IN (%s, %s) '
            'ORDER BY st.transaction_date DESC '
            'LIMIT 50',
            ['completed', 'partially_refunded'],
        ),
        'low_stock': (
            'SELECT ist.id, ist.qty_on_hand, ist.reorder_point '
            'FROM inventory_stock ist '
            'WHERE ist.qty_on_hand <= ist.reorder_point '
            'ORDER BY ist.qty_on_hand ASC '
            'LIMIT 100',
            [],
        ),
    }

    def handle(self, *args, **options):
        vendor = connection.vendor
        self.stdout.write(self.style.MIGRATE_HEADING('Phase 5 Query Plan Snapshot'))
        self.stdout.write(f'Connection vendor: {vendor}')

        with connection.cursor() as cursor:
            for name, (sql, params) in self.HOT_PATH_QUERIES.items():
                self.stdout.write('')
                self.stdout.write(self.style.HTTP_INFO(f'[{name}]'))

                explain_sql = (
                    'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ' + sql
                    if vendor == 'postgresql'
                    else 'EXPLAIN ' + sql
                )
                cursor.execute(explain_sql, params)
                rows = cursor.fetchall()

                for row in rows:
                    # PostgreSQL EXPLAIN returns a single text column per row.
                    self.stdout.write(str(row[0]))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Query plan snapshot complete.'))

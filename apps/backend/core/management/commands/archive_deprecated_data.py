import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings

class Command(BaseCommand):
    help = 'Archives data from deprecated apps (procurement, pricing, invoices) into a single SQL file.'

    def handle(self, *args, **options):
        archive_file_path = os.path.join(settings.BASE_DIR, '..', '..', 'contexts', 'archive.sql')
        
        deprecated_apps_models = [
            # procurement
            'procurement.supplier',
            'procurement.supplierproduct',
            'procurement.purchaseorder',
            'procurement.purchaseorderitem',
            # pricing
            'pricing.pricetier',
            'pricing.productpricetierrule',
            'pricing.productpricehistory',
            'pricing.suppliercosthistory',
            # invoices
            'invoices.invoicesequence',
            'invoices.businessprofile',
            'invoices.invoice',
            'invoices.invoiceitem',
            'invoices.invoicepayment',
        ]

        self.stdout.write(self.style.SUCCESS(f"Starting data archival to {archive_file_path}..."))

        try:
            with open(archive_file_path, 'w', encoding='utf-8') as f:
                self.stdout.write(self.style.NOTICE(f"Archiving models: {', '.join(deprecated_apps_models)}"))
                call_command(
                    'dumpdata',
                    *deprecated_apps_models,
                    format='json',
                    indent=2,
                    stdout=f
                )

            self.stdout.write(self.style.SUCCESS(f"Successfully archived data to {archive_file_path}"))
            self.stdout.write(self.style.WARNING("Please review the archive file to ensure all necessary data has been backed up before proceeding with schema removal."))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"An error occurred during archival: {e}"))
            if os.path.exists(archive_file_path):
                os.remove(archive_file_path)
            self.stdout.write(self.style.WARNING(f"Removed incomplete archive file: {archive_file_path}"))


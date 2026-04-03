from django.core.management.base import BaseCommand
from django.db import transaction

from vehicles.models import ProductVehicleFitment


class Command(BaseCommand):
    help = (
        "Detach ProductVehicleFitment.vehicle_year links after model/year_range backfill "
        "to prepare vehicle_years retirement (idempotent)."
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

        try:
            ProductVehicleFitment._meta.get_field("vehicle_year")
        except Exception:
            self.stdout.write(self.style.WARNING("vehicle_year field already retired; nothing to do."))
            return

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 3 Vehicle Year Decouple Backfill"))
        self.stdout.write(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")

        total = ProductVehicleFitment.objects.count()
        linked = ProductVehicleFitment.objects.exclude(vehicle_year_id__isnull=True).count()
        updated = 0

        self.stdout.write(f"Rows scanned: {total}")
        self.stdout.write(f"Rows with legacy vehicle_year link: {linked}")

        qs = ProductVehicleFitment.objects.exclude(vehicle_year_id__isnull=True).order_by("id")
        for fitment in qs.iterator():
            old_vehicle_year_id = fitment.vehicle_year_id
            fitment.vehicle_year_id = None
            fitment.save(update_fields=["vehicle_year", "updated_at"])
            updated += 1
            self.stdout.write(
                f"- fitment_id={fitment.id} detached vehicle_year_id={old_vehicle_year_id}"
            )

        if dry_run:
            transaction.set_rollback(True)
            self.stdout.write(self.style.WARNING("Dry run complete. All updates rolled back."))

        self.stdout.write(self.style.SUCCESS(f"Rows updated: {updated}"))
        self.stdout.write(self.style.SUCCESS("Vehicle year decouple backfill complete."))

from django.core.management.base import BaseCommand
from django.db import transaction

from vehicles.models import ProductVehicleFitment


class Command(BaseCommand):
    help = "Backfill ProductVehicleFitment.vehicle_model/year_range from legacy vehicle_year (idempotent)."

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
            self.stdout.write(self.style.WARNING("vehicle_year field already retired; nothing to backfill."))
            return

        fitments = ProductVehicleFitment.objects.select_related("vehicle_year__model").all().order_by("id")
        total = fitments.count()
        updated = 0

        self.stdout.write(self.style.MIGRATE_HEADING("Phase 3 Vehicle Fitment Backfill"))
        self.stdout.write(f"Rows scanned: {total}")
        self.stdout.write(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")

        for fitment in fitments.iterator():
            vehicle_year = fitment.vehicle_year
            model = vehicle_year.model if vehicle_year else None
            mapped_year_range = str(vehicle_year.year) if vehicle_year else None
            mapped_notes = fitment.fitment_notes or fitment.notes

            changed = False
            if fitment.vehicle_model_id != (model.id if model else None):
                fitment.vehicle_model = model
                changed = True

            if fitment.year_range != mapped_year_range:
                fitment.year_range = mapped_year_range
                changed = True

            if mapped_notes != fitment.fitment_notes:
                fitment.fitment_notes = mapped_notes
                changed = True

            if not changed:
                continue

            updated += 1
            self.stdout.write(
                f"- fitment_id={fitment.id} vehicle_model_id={fitment.vehicle_model_id} "
                f"year_range={fitment.year_range}"
            )

            fitment.save(update_fields=["vehicle_model", "year_range", "fitment_notes", "updated_at"])

        if dry_run:
            transaction.set_rollback(True)
            self.stdout.write(self.style.WARNING("Dry run complete. All updates rolled back."))

        self.stdout.write(self.style.SUCCESS(f"Rows updated: {updated}"))
        self.stdout.write(self.style.SUCCESS("Vehicle fitment backfill complete."))

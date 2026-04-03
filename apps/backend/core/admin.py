from django.contrib import admin

from core.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('table_name', 'record_pk', 'action', 'changed_by', 'created_at')
    search_fields = ('table_name', 'record_pk', 'changed_by__email')
    list_filter = ('action', 'table_name', 'created_at')
    readonly_fields = ('created_at',)

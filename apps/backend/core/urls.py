from django.urls import path

from .views import (
    SystemAuditLogView,
    SystemCutoverControlsView,
    SystemHealthView,
    SystemReconciliationView,
    SystemRolloutView,
)

urlpatterns = [
    path("health/", SystemHealthView.as_view(), name="system-health"),
    path("rollout/", SystemRolloutView.as_view(), name="system-rollout"),
    path("reconciliation/", SystemReconciliationView.as_view(), name="system-reconciliation"),
    path("audit/", SystemAuditLogView.as_view(), name="system-audit"),
    path("cutover-controls/", SystemCutoverControlsView.as_view(), name="system-cutover-controls"),
]

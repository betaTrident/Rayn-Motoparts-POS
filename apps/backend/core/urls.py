from django.urls import path

from .views import SystemHealthView, SystemReconciliationView, SystemRolloutView

urlpatterns = [
    path("health/", SystemHealthView.as_view(), name="system-health"),
    path("rollout/", SystemRolloutView.as_view(), name="system-rollout"),
    path("reconciliation/", SystemReconciliationView.as_view(), name="system-reconciliation"),
]

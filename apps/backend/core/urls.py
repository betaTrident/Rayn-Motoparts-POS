from django.urls import path

from .views import SystemHealthView

urlpatterns = [
    path("health/", SystemHealthView.as_view(), name="system-health"),
]

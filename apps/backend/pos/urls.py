from django.urls import path

from .views import (
    PosDashboardView,
    PosTransactionDetailView,
    PosTransactionListView,
)

urlpatterns = [
    path("dashboard/", PosDashboardView.as_view(), name="pos-dashboard"),
    path("transactions/", PosTransactionListView.as_view(), name="pos-transactions"),
    path(
        "transactions/<int:transaction_id>/",
        PosTransactionDetailView.as_view(),
        name="pos-transaction-detail",
    ),
]
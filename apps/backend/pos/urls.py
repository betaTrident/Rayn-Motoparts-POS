from django.urls import path

from .views import (
    CurrentCashSessionView,
    OpenCashSessionView,
    PaymentMethodListView,
    PosBootstrapView,
    PosCheckoutView,
    PosDashboardView,
    PosTransactionDetailView,
    PosTransactionListView,
)

urlpatterns = [
    path("bootstrap/", PosBootstrapView.as_view(), name="pos-bootstrap"),
    path("checkout/", PosCheckoutView.as_view(), name="pos-checkout"),
    path("payment-methods/", PaymentMethodListView.as_view(), name="pos-payment-methods"),
    path("cash-session/current/", CurrentCashSessionView.as_view(), name="pos-cash-session-current"),
    path("cash-sessions/open/", OpenCashSessionView.as_view(), name="pos-cash-session-open"),
    path("dashboard/", PosDashboardView.as_view(), name="pos-dashboard"),
    path("transactions/", PosTransactionListView.as_view(), name="pos-transactions"),
    path(
        "transactions/<int:transaction_id>/",
        PosTransactionDetailView.as_view(),
        name="pos-transaction-detail",
    ),
]

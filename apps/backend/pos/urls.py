from django.urls import path

from .views import PosDashboardView, PosWarehouseListView, PosTransactionListView

urlpatterns = [
    path("dashboard/", PosDashboardView.as_view(), name="pos-dashboard"),
    path("warehouses/", PosWarehouseListView.as_view(), name="pos-warehouses"),
    path("transactions/", PosTransactionListView.as_view(), name="pos-transactions"),
]
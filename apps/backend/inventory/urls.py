from django.urls import path

from . import views

urlpatterns = [
    path("stock/", views.InventoryStockListView.as_view()),
    path("stock/summary/", views.InventoryStockSummaryView.as_view()),
    path("stock/<int:pk>/configure/", views.StockConfigureView.as_view()),
    path("movements/", views.StockMovementListView.as_view()),
    path("adjust/", views.StockAdjustView.as_view()),
]

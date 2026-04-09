from django.urls import path

from .views import ReturnTransactionDetailView, ReturnTransactionListView

urlpatterns = [
    path("", ReturnTransactionListView.as_view(), name="returns-list"),
    path("<int:transaction_id>/", ReturnTransactionDetailView.as_view(), name="returns-detail"),
]

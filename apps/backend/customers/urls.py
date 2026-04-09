from django.urls import path

from .views import CustomerDetailView, CustomerListView

urlpatterns = [
    path("", CustomerListView.as_view(), name="customers-list"),
    path("<int:customer_id>/", CustomerDetailView.as_view(), name="customers-detail"),
]

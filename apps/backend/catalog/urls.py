from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='product-category')
router.register('items', ProductViewSet, basename='product-item')

urlpatterns = [
    path('', include(router.urls)),
]

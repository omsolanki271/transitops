from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FuelLogViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'fuel-logs', FuelLogViewSet, basename='fuel-log')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceLogViewSet

router = DefaultRouter()
router.register(r'maintenance-logs', MaintenanceLogViewSet, basename='maintenance-log')
router.register(r'maintenance', MaintenanceLogViewSet, basename='maintenance')

urlpatterns = [
    path('', include(router.urls)),
]

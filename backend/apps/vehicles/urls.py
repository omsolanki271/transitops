from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, DocumentViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'documents', DocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]

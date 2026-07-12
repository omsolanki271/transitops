from rest_framework import viewsets, status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import datetime

from core.response import standard_response
from .models import Driver
from .serializers import DriverSerializer
from .permissions import CanManageDrivers
from .services import create_driver, update_driver

class DriverViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Driver CRUD operations.
    Includes custom filtering by status, search by name/license, and sorting.
    """
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [CanManageDrivers]
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ('status',)
    search_fields = ('name', 'license_number')
    ordering_fields = ('name', 'safety_score', 'license_expiry_date', 'created_at')
    ordering = ('created_at',)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(success=True, data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standard_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver = create_driver(serializer.validated_data)
        return standard_response(success=True, data=self.get_serializer(driver).data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        driver = update_driver(instance, serializer.validated_data)
        return standard_response(success=True, data=self.get_serializer(driver).data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return standard_response(success=True, data={"message": "Driver deleted successfully."}, status_code=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='available-for-dispatch')
    def available_for_dispatch(self, request):
        """
        GET /api/v1/drivers/available-for-dispatch/
        Excludes drivers who are suspended, on a trip, off duty, or have an expired license.
        """
        drivers = Driver.objects.filter(
            status='available',
            license_expiry_date__gte=datetime.date.today()
        )
        serializer = self.get_serializer(drivers, many=True)
        return standard_response(success=True, data=serializer.data)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from core.exceptions import StateTransitionConflict

from core.response import standard_response
from .models import MaintenanceLog
from .serializers import MaintenanceLogSerializer
from core.permissions import CanAccessMaintenance
from .services import create_maintenance_log, close_maintenance_log

class MaintenanceLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Maintenance Log CRUD and state transition (close) operations.
    Enforces business logic at the service layer.
    """
    queryset = MaintenanceLog.objects.all()
    serializer_class = MaintenanceLogSerializer
    permission_classes = [CanAccessMaintenance]
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ('status', 'vehicle')
    search_fields = ('maintenance_type', 'description', 'vehicle__registration_number')
    ordering_fields = ('started_at', 'cost', 'created_at')
    ordering = ('-created_at',)

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
        log = create_maintenance_log(serializer.validated_data, request.user)
        return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        if instance.status == 'closed':
            raise StateTransitionConflict("Cannot edit a closed maintenance log.")
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        log = serializer.save()
        return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # If active, restore vehicle status
        if instance.status == 'active':
            vehicle = instance.vehicle
            if vehicle.status == 'in_shop':
                vehicle.status = 'available'
                vehicle.save()
        instance.delete()
        return standard_response(success=True, data={"message": "Maintenance log deleted successfully."}, status_code=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='close')
    def close(self, request, pk=None):
        """
        POST /api/v1/maintenance-logs/{id}/close/
        Closes the maintenance log and restores vehicle status to available.
        """
        log = close_maintenance_log(pk)
        return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_200_OK)

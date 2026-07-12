from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.db import models
from core.exceptions import StateTransitionConflict, BusinessRuleValidationError

from core.response import standard_response
from .models import MaintenanceLog
from .serializers import MaintenanceLogSerializer
from core.permissions import CanAccessMaintenance
from .services import create_maintenance_log, update_maintenance_log, close_maintenance_log

class MaintenancePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'data': data,
            'meta': {
                'page': self.page.number,
                'page_size': self.page.paginator.per_page,
                'total': self.page.paginator.count
            }
        })

from rest_framework.response import Response

class MaintenanceLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Maintenance Log CRUD and state transition (close) operations.
    Enforces business logic at the service layer.
    """
    serializer_class = MaintenanceLogSerializer
    permission_classes = [CanAccessMaintenance]
    pagination_class = MaintenancePagination

    def get_queryset(self):
        queryset = MaintenanceLog.objects.all()
        
        # Status Filter
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
            
        # Search Filter
        search_param = self.request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                models.Q(vehicle__name_model__icontains=search_param) |
                models.Q(vehicle__registration_number__icontains=search_param) |
                models.Q(service_type__icontains=search_param) |
                models.Q(maintenance_type__icontains=search_param) |
                models.Q(description__icontains=search_param) |
                models.Q(workshop__icontains=search_param) |
                models.Q(mechanic__icontains=search_param)
            )

        # Sorting
        sort_param = self.request.query_params.get('ordering') or self.request.query_params.get('sort')
        if sort_param:
            if sort_param == 'newest':
                queryset = queryset.order_by('-created_at')
            elif sort_param == 'oldest':
                queryset = queryset.order_by('created_at')
            elif sort_param == 'highest_cost':
                queryset = queryset.order_by('-cost')
            elif sort_param == 'lowest_cost':
                queryset = queryset.order_by('cost')
            elif sort_param == 'vehicle_name':
                queryset = queryset.order_by('vehicle__name_model')
            else:
                queryset = queryset.order_by(sort_param)
        else:
            queryset = queryset.order_by('-created_at')
            
        return queryset

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
        try:
            log = create_maintenance_log(serializer.validated_data, request.user)
            return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_201_CREATED)
        except (BusinessRuleValidationError, StateTransitionConflict) as e:
            return standard_response(
                success=False,
                error={
                    "code": getattr(e, "code", "VALIDATION_ERROR"),
                    "message": str(e),
                    "fields": getattr(e, "fields", {})
                },
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            log = update_maintenance_log(instance.id, serializer.validated_data, request.user)
            return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_200_OK)
        except (BusinessRuleValidationError, StateTransitionConflict) as e:
            return standard_response(
                success=False,
                error={
                    "code": getattr(e, "code", "VALIDATION_ERROR"),
                    "message": str(e),
                    "fields": getattr(e, "fields", {})
                },
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status == 'active':
            vehicle = instance.vehicle
            if vehicle.status == 'in_shop':
                vehicle.status = 'available' if vehicle.status != 'retired' else 'retired'
                vehicle.save()
        instance.delete()
        return standard_response(success=True, data={"message": "Maintenance log deleted successfully."}, status_code=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'], url_path='close')
    def close(self, request, pk=None):
        """
        POST/PATCH /api/v1/maintenance/{id}/close/
        Closes the maintenance log and restores vehicle status to available.
        """
        try:
            log = close_maintenance_log(pk, request.user)
            return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_200_OK)
        except (BusinessRuleValidationError, StateTransitionConflict) as e:
            return standard_response(
                success=False,
                error={
                    "code": getattr(e, "code", "VALIDATION_ERROR"),
                    "message": str(e),
                    "fields": getattr(e, "fields", {})
                },
                status_code=status.HTTP_400_BAD_REQUEST
            )

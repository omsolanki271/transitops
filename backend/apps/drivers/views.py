from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import datetime

from core.response import standard_response
from .models import Driver
from .serializers import DriverSerializer
from core.permissions import CanAccessDrivers
from .services import create_driver, update_driver

class DriverViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Driver CRUD operations.
    Includes custom filtering by status, search by name/license, and sorting.
    """
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [CanAccessDrivers]
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
        partial = kwargs.pop('partial', True)
        instance = self.get_object()

        if request.user.role == 'safety_officer':
            import decimal
            allowed_fields = {'status', 'safety_score', 'license_expiry_date', 'license_number', 'license_category'}
            
            # Validate that they aren't changing any read-only/forbidden fields
            for key, val in request.data.items():
                if key not in allowed_fields and hasattr(instance, key):
                    current_val = getattr(instance, key)
                    if current_val is not None:
                        # Compare date, decimal, or general values safely
                        if isinstance(current_val, datetime.date):
                            try:
                                # handle YYYY-MM-DD
                                d_val = datetime.datetime.strptime(str(val).split('T')[0], '%Y-%m-%d').date()
                                if current_val != d_val:
                                    raise PermissionDenied(f"Safety Officers are not allowed to modify '{key}'.")
                            except Exception:
                                if str(current_val) != str(val):
                                    raise PermissionDenied(f"Safety Officers are not allowed to modify '{key}'.")
                        elif isinstance(current_val, decimal.Decimal):
                            try:
                                if current_val != decimal.Decimal(str(val)):
                                    raise PermissionDenied(f"Safety Officers are not allowed to modify '{key}'.")
                            except Exception:
                                if str(current_val) != str(val):
                                    raise PermissionDenied(f"Safety Officers are not allowed to modify '{key}'.")
                        else:
                            if str(current_val) != str(val):
                                raise PermissionDenied(f"Safety Officers are not allowed to modify '{key}'.")

            # Filter data so only allowed fields are validated and updated
            filtered_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            serializer = self.get_serializer(instance, data=filtered_data, partial=True)
        else:
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

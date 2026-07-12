from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.response import standard_response
from core.permissions import IsFleetManagerOrReadOnly
from .models import Vehicle, Document
from .serializers import VehicleSerializer, DocumentSerializer
from .services import create_vehicle, update_vehicle, get_available_vehicles_for_dispatch

class VehicleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Vehicle CRUD operations.
    Includes custom filtering by status, type, and region, and custom action for dropdown listing.
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ('status', 'vehicle_type', 'region')
    search_fields = ('registration_number', 'name_model')
    ordering_fields = ('registration_number', 'odometer', 'acquisition_cost', 'created_at')
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
        vehicle = create_vehicle(serializer.validated_data)
        return standard_response(success=True, data=self.get_serializer(vehicle).data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        vehicle = update_vehicle(instance, serializer.validated_data)
        return standard_response(success=True, data=self.get_serializer(vehicle).data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return standard_response(success=True, data={"message": "Vehicle deleted successfully."}, status_code=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='available-for-dispatch')
    def available_for_dispatch(self, request):
        """
        GET /api/v1/vehicles/available-for-dispatch/
        Excludes retired and in-shop vehicles for trip assignments.
        """
        vehicles = get_available_vehicles_for_dispatch()
        serializer = self.get_serializer(vehicles, many=True)
        return standard_response(success=True, data=serializer.data)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Vehicle Document uploads (bonus feature).
    """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsFleetManagerOrReadOnly]
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ('vehicle', 'document_type')
    search_fields = ('document_type',)
    ordering = ('-uploaded_at',)

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
        document = serializer.save()
        return standard_response(success=True, data=self.get_serializer(document).data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        return standard_response(success=True, data=self.get_serializer(document).data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return standard_response(success=True, data={"message": "Document deleted successfully."}, status_code=status.HTTP_200_OK)

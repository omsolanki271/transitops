from rest_framework import viewsets, status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.response import standard_response
from .models import Trip
from .serializers import TripSerializer, TripCompleteSerializer
from .permissions import CanManageTrips
from .services import create_trip, update_trip, dispatch_trip, complete_trip, cancel_trip

class TripViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Trip CRUD and custom state transition operations.
    Enforces business rules through the service layer.
    """
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    permission_classes = [CanManageTrips]
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ('status', 'vehicle', 'driver')
    search_fields = ('source', 'destination', 'vehicle__registration_number', 'driver__name')
    ordering_fields = ('created_at', 'cargo_weight', 'planned_distance')
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
        trip = create_trip(serializer.validated_data, request.user)
        return standard_response(success=True, data=self.get_serializer(trip).data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        trip = update_trip(instance, serializer.validated_data)
        return standard_response(success=True, data=self.get_serializer(trip).data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return standard_response(success=True, data={"message": "Trip deleted successfully."}, status_code=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch_trip_action(self, request, pk=None):
        """
        POST /api/v1/trips/{id}/dispatch/
        Transitions the trip status from draft to dispatched and marks vehicle and driver as on_trip.
        """
        trip = dispatch_trip(pk)
        return standard_response(success=True, data=self.get_serializer(trip).data, status_code=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        """
        POST /api/v1/trips/{id}/complete/
        Transitions the trip status from dispatched to completed, updates vehicle odometer,
        and marks vehicle and driver as available.
        """
        serializer = TripCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trip = complete_trip(
            pk,
            serializer.validated_data['final_odometer'],
            serializer.validated_data['fuel_consumed'],
            serializer.validated_data['actual_distance']
        )
        return standard_response(success=True, data=self.get_serializer(trip).data, status_code=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        POST /api/v1/trips/{id}/cancel/
        Transitions the trip status from draft or dispatched to cancelled and restores resources.
        """
        trip = cancel_trip(pk)
        return standard_response(success=True, data=self.get_serializer(trip).data, status_code=status.HTTP_200_OK)

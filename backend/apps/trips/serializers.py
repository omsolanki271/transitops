from rest_framework import serializers
from .models import Trip
from apps.vehicles.serializers import VehicleSerializer
from apps.drivers.serializers import DriverSerializer
from apps.users.serializers import UserSerializer

class TripSerializer(serializers.ModelSerializer):
    """
    Serializer for Trip CRUD operations.
    Handles read representation as fully nested objects, and write input as ID references.
    """
    class Meta:
        model = Trip
        fields = '__all__'
        read_only_fields = (
            'created_by', 'status', 'dispatched_at', 'completed_at', 'cancelled_at',
            'actual_distance', 'final_odometer', 'fuel_consumed', 'created_at', 'updated_at'
        )

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['vehicle'] = VehicleSerializer(instance.vehicle).data
        rep['driver'] = DriverSerializer(instance.driver).data
        rep['created_by'] = UserSerializer(instance.created_by).data
        return rep


class TripCompleteSerializer(serializers.Serializer):
    """
    Serializer for the POST body required when completing a trip.
    """
    final_odometer = serializers.DecimalField(max_digits=10, decimal_places=2)
    fuel_consumed = serializers.DecimalField(max_digits=10, decimal_places=2)
    actual_distance = serializers.DecimalField(max_digits=10, decimal_places=2)

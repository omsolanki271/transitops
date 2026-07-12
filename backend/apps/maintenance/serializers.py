from rest_framework import serializers
from .models import MaintenanceLog
from apps.vehicles.serializers import VehicleSerializer
from apps.users.serializers import UserSerializer

class MaintenanceLogSerializer(serializers.ModelSerializer):
    """
    Serializer for Maintenance Log CRUD.
    Handles read representation as fully nested objects, and write input as ID references.
    """
    class Meta:
        model = MaintenanceLog
        fields = '__all__'
        read_only_fields = ('created_by', 'status', 'started_at', 'closed_at', 'created_at', 'updated_at')

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['vehicle'] = VehicleSerializer(instance.vehicle).data
        rep['created_by'] = UserSerializer(instance.created_by).data
        return rep

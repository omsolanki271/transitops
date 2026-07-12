from rest_framework import serializers
from .models import FuelLog, Expense
from apps.vehicles.serializers import VehicleSerializer
from apps.trips.serializers import TripSerializer
from apps.users.serializers import UserSerializer

class FuelLogSerializer(serializers.ModelSerializer):
    """
    Serializer for Fuel Logs CRUD.
    Handles read representation as fully nested objects, and write input as ID references.
    """
    class Meta:
        model = FuelLog
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at',)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['vehicle'] = VehicleSerializer(instance.vehicle).data
        if instance.trip:
            rep['trip'] = TripSerializer(instance.trip).data
        if instance.created_by:
            rep['created_by'] = UserSerializer(instance.created_by).data
        return rep

class ExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer for Expenses CRUD.
    Handles read representation as fully nested objects, and write input as ID references.
    """
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at',)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['vehicle'] = VehicleSerializer(instance.vehicle).data
        if instance.created_by:
            rep['created_by'] = UserSerializer(instance.created_by).data
        return rep

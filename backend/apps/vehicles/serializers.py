from rest_framework import serializers
from .models import Vehicle, Document

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('uploaded_at',)

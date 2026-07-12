from rest_framework import serializers
import datetime
from .models import Driver

class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate_safety_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Safety score must be between 0 and 100.")
        return value

    def validate_license_expiry_date(self, value):
        if value < datetime.date.today():
            raise serializers.ValidationError("License expiry date must be a valid future date.")
        return value

    def validate_license_category(self, value):
        # Support both new standard values and map/allow legacy seed values safely
        allowed_categories = {'LMV', 'HMV', 'Transport', 'Heavy Motor Vehicle', 'heavy_vehicle', 'light_vehicle'}
        if value not in allowed_categories:
            raise serializers.ValidationError("License category must be one of: LMV, HMV, Transport, Heavy Motor Vehicle.")
        
        # Normalize legacy database seed values on-the-fly
        if value == 'heavy_vehicle':
            return 'HMV'
        if value == 'light_vehicle':
            return 'LMV'
        return value


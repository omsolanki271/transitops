from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'phone', 'is_active', 'date_joined')
        read_only_fields = ('id', 'is_active', 'date_joined')

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                                 username=email, password=password)
            if not user:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is deactivated.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        refresh = RefreshToken.for_user(user)
        # Embed custom claims in the token
        refresh['role'] = user.role
        refresh['email'] = user.email
        refresh['full_name'] = user.full_name

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }

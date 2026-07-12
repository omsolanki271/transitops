from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from core.response import standard_response
from .serializers import LoginSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticates a user and returns access + refresh JWT tokens along with the user profile.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return standard_response(success=True, data=serializer.validated_data, status_code=status.HTTP_200_OK)

class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the provided refresh token to log out the user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return standard_response(
                    success=False,
                    error={
                        "code": "VALIDATION_ERROR",
                        "message": "Refresh token is required.",
                        "fields": {"refresh": ["This field is required."]}
                    },
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return standard_response(success=True, data={"message": "Logged out successfully."}, status_code=status.HTTP_200_OK)
        except (TokenError, InvalidToken) as e:
            return standard_response(
                success=False,
                error={
                    "code": "INVALID_TOKEN",
                    "message": str(e),
                    "fields": {}
                },
                status_code=status.HTTP_400_BAD_REQUEST
            )

class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/refresh/
    Rotates/refreshes the access token using a valid refresh token.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            return standard_response(success=True, data=serializer.validated_data, status_code=status.HTTP_200_OK)
        except TokenError as e:
            raise InvalidToken(e.args[0])

class MeView(APIView):
    """
    GET /api/v1/auth/me/
    Returns the currently authenticated user's profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return standard_response(success=True, data=serializer.data, status_code=status.HTTP_200_OK)

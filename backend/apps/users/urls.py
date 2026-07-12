from django.urls import path
from .views import LoginView, LogoutView, CustomTokenRefreshView, MeView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='auth_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
]

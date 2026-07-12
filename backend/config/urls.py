from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.views import hello_world

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/hello/', hello_world, name='hello_world'),
    
    # Auth Endpoints
    path('api/v1/auth/', include('apps.users.urls')),
    
    # Core Resource Endpoints
    path('api/v1/', include('apps.vehicles.urls')),
    path('api/v1/', include('apps.drivers.urls')),
    path('api/v1/', include('apps.trips.urls')),
    path('api/v1/', include('apps.maintenance.urls')),
    path('api/v1/', include('apps.fuel_expenses.urls')),
    
    # Dashboard & Reports Endpoints
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    
    # Swagger/OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

from django.urls import path
from .views import VehiclePerformanceReportView, ExportReportView

urlpatterns = [
    path('performance/', VehiclePerformanceReportView.as_view(), name='reports_performance'),
    path('export/', ExportReportView.as_view(), name='reports_export'),
]

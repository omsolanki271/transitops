from django.urls import path
from .views import (
    VehiclePerformanceReportView,
    ExportReportView,
    SafetyReportView,
    ExportSafetyCSVView,
    ExportSafetyPDFView
)

urlpatterns = [
    path('performance/', VehiclePerformanceReportView.as_view(), name='reports_performance'),
    path('export/', ExportReportView.as_view(), name='reports_export'),
    path('safety/', SafetyReportView.as_view(), name='reports_safety'),
    path('export/csv/', ExportSafetyCSVView.as_view(), name='reports_export_csv'),
    path('export/pdf/', ExportSafetyPDFView.as_view(), name='reports_export_pdf'),
]


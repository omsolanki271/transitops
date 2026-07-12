from rest_framework.views import APIView
from rest_framework import status
from django.http import StreamingHttpResponse
from core.response import standard_response
from .permissions import CanAccessReports
from .services import get_vehicle_performance_report, generate_csv_report

class VehiclePerformanceReportView(APIView):
    """
    GET /api/v1/reports/performance/
    Returns aggregated ROI, fuel efficiency, and operational cost metrics for all vehicles.
    """
    permission_classes = [CanAccessReports]

    def get(self, request, *args, **kwargs):
        report = get_vehicle_performance_report()
        return standard_response(success=True, data=report, status_code=status.HTTP_200_OK)

class ExportReportView(APIView):
    """
    GET /api/v1/reports/export/?format=csv&report=fleet_utilization
    Streams a CSV file containing the requested report data.
    """
    permission_classes = [CanAccessReports]

    def get(self, request, *args, **kwargs):
        report_type = request.query_params.get('report', 'vehicle_performance')
        export_format = request.query_params.get('format', 'csv')

        if export_format.lower() != 'csv':
            return standard_response(
                success=False,
                error={
                    "code": "VALIDATION_ERROR",
                    "message": "Only 'csv' export format is supported.",
                    "fields": {"format": ["Value must be 'csv'."]}
                },
                status_code=status.HTTP_400_BAD_REQUEST
            )

        response_generator, filename = generate_csv_report(report_type)
        
        response = StreamingHttpResponse(response_generator, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

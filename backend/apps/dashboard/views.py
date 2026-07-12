from rest_framework.views import APIView
from rest_framework import status, permissions
from core.response import standard_response
from .services import calculate_dashboard_summary

class DashboardSummaryView(APIView):
    """
    GET /api/v1/dashboard/summary/
    Fetches the operational KPIs. Supports filtering by vehicle_type, status, and region.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        vehicle_type = request.query_params.get('vehicle_type')
        status_filter = request.query_params.get('status')
        region = request.query_params.get('region')

        kpis = calculate_dashboard_summary(
            vehicle_type=vehicle_type,
            status=status_filter,
            region=region
        )
        return standard_response(success=True, data=kpis, status_code=status.HTTP_200_OK)

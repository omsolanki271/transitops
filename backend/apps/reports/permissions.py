from rest_framework.permissions import BasePermission

class CanAccessReports(BasePermission):
    """
    Role constraint for reports access.
    Allowed: Fleet Manager, Financial Analyst, Safety Officer.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['fleet_manager', 'financial_analyst', 'safety_officer']

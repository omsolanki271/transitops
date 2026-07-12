from rest_framework.permissions import BasePermission, SAFE_METHODS

FLEET_MANAGER = 'fleet_manager'
DISPATCHER = 'dispatcher'
SAFETY_OFFICER = 'safety_officer'
FINANCIAL_ANALYST = 'financial_analyst'


def _is_authenticated(request):
    return bool(request.user and request.user.is_authenticated)


def _has_role(request, roles):
    return _is_authenticated(request) and request.user.role in roles


class IsFleetManager(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, [FLEET_MANAGER])


class IsSafetyOfficer(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, [SAFETY_OFFICER])


class IsFinancialAnalyst(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, [FINANCIAL_ANALYST])


class IsDispatcher(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, [DISPATCHER])


class CanAccessVehicles(BasePermission):
    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in [FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST]
        return request.user.role == FLEET_MANAGER


class CanAccessDrivers(BasePermission):
    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        role = request.user.role
        if role == FLEET_MANAGER:
            return True
        if role == DISPATCHER:
            return request.method in SAFE_METHODS
        if role == SAFETY_OFFICER:
            return request.method in SAFE_METHODS or request.method in ['PUT', 'PATCH']
        return False


class CanAccessTrips(BasePermission):
    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in [FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST]
        return request.user.role in [FLEET_MANAGER, DISPATCHER]


class CanAccessMaintenance(BasePermission):
    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in [FLEET_MANAGER, FINANCIAL_ANALYST, SAFETY_OFFICER]
        return request.user.role == FLEET_MANAGER



class CanAccessFuelExpenses(BasePermission):
    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in [FLEET_MANAGER, FINANCIAL_ANALYST]
        return request.user.role in [FLEET_MANAGER, FINANCIAL_ANALYST]

    def has_object_permission(self, request, view, obj):
        if not _is_authenticated(request):
            return False
        if request.user.role == FLEET_MANAGER:
            return True
        if request.user.role == FINANCIAL_ANALYST and request.method not in SAFE_METHODS:
            return getattr(obj, 'created_by_id', None) == request.user.id
        return request.method in SAFE_METHODS


class CanAccessReports(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, [FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST])


class CanExportReports(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, [FLEET_MANAGER, FINANCIAL_ANALYST])

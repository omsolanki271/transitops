from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsFleetManager(BasePermission):
    """
    Allows access only to Fleet Managers.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'fleet_manager'

class IsSafetyOfficer(BasePermission):
    """
    Allows access only to Safety Officers.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'safety_officer'

class IsFinancialAnalyst(BasePermission):
    """
    Allows access only to Financial Analysts.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'financial_analyst'

class IsDriver(BasePermission):
    """
    Allows access only to Drivers.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'driver'

class IsFleetManagerOrReadOnly(BasePermission):
    """
    Vehicle module permission:
    - Read: Fleet Manager, Safety Officer, Financial Analyst.
    - Write: Fleet Manager.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'safety_officer', 'financial_analyst']
        return request.user.role == 'fleet_manager'

class CanManageDrivers(BasePermission):
    """
    Driver module permission:
    - Read: Fleet Manager, Safety Officer, Financial Analyst.
    - Write: Fleet Manager, Safety Officer.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'safety_officer', 'financial_analyst']
        return request.user.role in ['fleet_manager', 'safety_officer']

class CanManageTrips(BasePermission):
    """
    Trip module permission:
    - Read: Fleet Manager, Safety Officer, Financial Analyst, Driver.
    - Write: Fleet Manager, Driver.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst']
        return request.user.role in ['fleet_manager', 'driver']

class CanManageMaintenance(BasePermission):
    """
    Maintenance module permission:
    - Read: Fleet Manager, Safety Officer, Financial Analyst.
    - Write: Fleet Manager.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'safety_officer', 'financial_analyst']
        return request.user.role == 'fleet_manager'

class CanManageFuelExpenses(BasePermission):
    """
    Fuel & Expense module permission:
    - Read: Fleet Manager, Driver, Financial Analyst.
    - Write: Fleet Manager, Driver.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'driver', 'financial_analyst']
        return request.user.role in ['fleet_manager', 'driver']

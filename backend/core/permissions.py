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

class IsDispatcher(BasePermission):
    """
    Allows access only to Dispatchers.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'dispatcher'

class IsFleetManagerOrReadOnly(BasePermission):
    """
    Vehicle module permission:
    - Read: Fleet Manager, Safety Officer, Financial Analyst, Dispatcher (needs to see vehicles when creating trips).
    - Write: Fleet Manager.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'safety_officer', 'financial_analyst', 'dispatcher']
        return request.user.role == 'fleet_manager'

class CanManageDrivers(BasePermission):
    """
    Driver module permission:
    - Read: Fleet Manager, Safety Officer, Financial Analyst, Dispatcher (needs to see drivers when creating trips).
    - Write: Fleet Manager, Safety Officer.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'safety_officer', 'financial_analyst', 'dispatcher']
        return request.user.role in ['fleet_manager', 'safety_officer']

class CanManageTrips(BasePermission):
    """
    Trip module permission:
    - Read: Fleet Manager, Safety Officer, Financial Analyst, Dispatcher.
    - Write: Fleet Manager, Dispatcher.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']
        return request.user.role in ['fleet_manager', 'dispatcher']

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
    - Read: Fleet Manager, Financial Analyst.
    - Write: Fleet Manager.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.role in ['fleet_manager', 'financial_analyst']
        return request.user.role == 'fleet_manager'

from django.db.models import Sum
from core.exceptions import BusinessRuleValidationError
from apps.vehicles.models import Vehicle
from apps.maintenance.models import MaintenanceLog
from .models import FuelLog, Expense
import decimal

def create_fuel_log(data, user):
    """
    Business service to create a fuel log. Enforces positive inputs.
    """
    liters = data.get('liters')
    cost = data.get('cost')
    
    if liters <= 0:
        raise BusinessRuleValidationError("Liters must be positive.", fields={"liters": ["Must be greater than 0."]})
    if cost <= 0:
        raise BusinessRuleValidationError("Cost must be positive.", fields={"cost": ["Must be greater than 0."]})
        
    data['created_by'] = user
    return FuelLog.objects.create(**data)

def create_expense(data, user):
    """
    Business service to create an expense. Enforces positive inputs.
    """
    amount = data.get('amount')
    
    if amount <= 0:
        raise BusinessRuleValidationError("Amount must be positive.", fields={"amount": ["Must be greater than 0."]})
        
    data['created_by'] = user
    return Expense.objects.create(**data)

def get_vehicle_cost_rollup(vehicle_id):
    """
    Calculates total fuel cost, maintenance cost, other expenses, and overall operational cost for a vehicle.
    This is used dynamically in Reports.
    """
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return None

    # Calculate total fuel cost from FuelLog
    fuel_cost = FuelLog.objects.filter(vehicle=vehicle).aggregate(total=Sum('cost'))['total'] or decimal.Decimal('0.00')
    
    # Calculate total maintenance cost from MaintenanceLog
    maintenance_cost = MaintenanceLog.objects.filter(vehicle=vehicle).aggregate(total=Sum('cost'))['total'] or decimal.Decimal('0.00')
    
    # Calculate other expenses from Expense model
    other_expenses = Expense.objects.filter(vehicle=vehicle).aggregate(total=Sum('amount'))['total'] or decimal.Decimal('0.00')
    
    # Total operational cost
    total_operational_cost = fuel_cost + maintenance_cost + other_expenses

    return {
        "vehicle_id": vehicle.id,
        "registration_number": vehicle.registration_number,
        "name_model": vehicle.name_model,
        "fuel_cost": fuel_cost,
        "maintenance_cost": maintenance_cost,
        "other_expenses": other_expenses,
        "total_operational_cost": total_operational_cost
    }

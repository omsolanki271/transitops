from django.utils import timezone
from core.exceptions import BusinessRuleValidationError, StateTransitionConflict
from apps.vehicles.models import Vehicle
from .models import MaintenanceLog

def create_maintenance_log(data, user):
    """
    Business service to create a maintenance log.
    Automatically sets vehicle status to 'in_shop'.
    """
    vehicle = data.get('vehicle')
    cost = data.get('cost')
    
    # Enforce positive inputs
    if cost < 0:
        raise BusinessRuleValidationError(
            "Maintenance cost must be positive.",
            fields={"cost": ["Must be a positive value."]}
        )
        
    if vehicle.status == 'retired':
        raise BusinessRuleValidationError(
            "Retired vehicles cannot be put in maintenance.",
            fields={"vehicle": ["Vehicle is retired."]}
        )
    elif vehicle.status == 'on_trip':
        raise BusinessRuleValidationError(
            "Vehicles currently on trip cannot be put in maintenance.",
            fields={"vehicle": ["Vehicle is currently on a trip."]}
        )
        
    # Create log and update vehicle status
    data['created_by'] = user
    data['status'] = 'active'
    
    log = MaintenanceLog.objects.create(**data)
    
    vehicle.status = 'in_shop'
    vehicle.save()
    
    return log

def close_maintenance_log(log_id):
    """
    Business action to close a maintenance log.
    Restores the vehicle's status to 'available' unless it was retired.
    """
    try:
        log = MaintenanceLog.objects.get(id=log_id)
    except MaintenanceLog.DoesNotExist:
        raise BusinessRuleValidationError("Maintenance log not found.")
        
    if log.status == 'closed':
        raise StateTransitionConflict("This maintenance log is already closed.")
        
    log.status = 'closed'
    log.closed_at = timezone.now()
    log.save()
    
    vehicle = log.vehicle
    # Restore status unless retired
    if vehicle.status == 'in_shop':
        vehicle.status = 'available'
        vehicle.save()
        
    return log

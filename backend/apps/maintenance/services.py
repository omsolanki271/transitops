from django.utils import timezone
from core.exceptions import BusinessRuleValidationError, StateTransitionConflict
from apps.vehicles.models import Vehicle
from .models import MaintenanceLog

def create_maintenance_log(data, user):
    """
    Business service to create a maintenance log.
    Automatically sets vehicle status to 'in_shop' if status is 'active'.
    """
    vehicle = data.get('vehicle')
    cost = data.get('cost')
    service_type = data.get('service_type') or data.get('maintenance_type')
    start_date = data.get('start_date') or timezone.now().date()
    end_date = data.get('end_date')
    status_val = data.get('status', 'active')

    if not vehicle:
        raise BusinessRuleValidationError(
            "Vehicle selection is required.",
            fields={"vehicle": ["Vehicle is required."]}
        )
    if not service_type:
        raise BusinessRuleValidationError(
            "Service type is required.",
            fields={"service_type": ["Service type is required."]}
        )
    if cost is None or cost <= 0:
        raise BusinessRuleValidationError(
            "Maintenance cost must be greater than zero.",
            fields={"cost": ["Must be greater than zero."]}
        )
    if end_date and start_date and end_date < start_date:
        raise BusinessRuleValidationError(
            "End date must be greater than or equal to start date.",
            fields={"end_date": ["End date cannot be before start date."]}
        )

    if vehicle.status == 'retired':
        raise BusinessRuleValidationError(
            "Retired vehicles cannot be put in maintenance.",
            fields={"vehicle": ["Vehicle is retired."]}
        )
    elif vehicle.status == 'on_trip' and status_val == 'active':
        raise BusinessRuleValidationError(
            "Vehicles currently on trip cannot be put in maintenance.",
            fields={"vehicle": ["Vehicle is currently on a trip."]}
        )

    # Set helper fields
    data['created_by'] = user
    data['service_type'] = service_type
    data['maintenance_type'] = service_type
    data['start_date'] = start_date
    if status_val == 'active' and not data.get('started_at'):
        data['started_at'] = timezone.now()

    # Add history
    data['history'] = f"[{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}] Maintenance scheduled with status: {status_val.upper()} by {user.email}\n"

    log = MaintenanceLog.objects.create(**data)

    if status_val == 'active':
        vehicle.status = 'in_shop'
        vehicle.save()

    return log

def update_maintenance_log(log_id, data, user):
    """
    Business service to update a maintenance log.
    Ensures vehicle status is synchronized.
    """
    try:
        log = MaintenanceLog.objects.get(id=log_id)
    except MaintenanceLog.DoesNotExist:
        raise BusinessRuleValidationError("Maintenance log not found.")

    if log.status in ['completed', 'cancelled']:
        raise StateTransitionConflict(f"Cannot edit a {log.status} maintenance log.")

    vehicle = data.get('vehicle', log.vehicle)
    cost = data.get('cost')
    service_type = data.get('service_type') or data.get('maintenance_type')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    status_val = data.get('status', log.status)

    if 'vehicle' in data and not vehicle:
        raise BusinessRuleValidationError(
            "Vehicle selection is required.",
            fields={"vehicle": ["Vehicle is required."]}
        )
    if ('service_type' in data or 'maintenance_type' in data) and not service_type:
        raise BusinessRuleValidationError(
            "Service type is required.",
            fields={"service_type": ["Service type is required."]}
        )
    if 'cost' in data and (cost is None or cost <= 0):
        raise BusinessRuleValidationError(
            "Maintenance cost must be greater than zero.",
            fields={"cost": ["Must be greater than zero."]}
        )
    if 'start_date' in data and not start_date:
        raise BusinessRuleValidationError(
            "Start date is required.",
            fields={"start_date": ["Start date is required."]}
        )
    
    v_start = start_date or log.start_date
    v_end = end_date or log.end_date
    if v_end and v_start and v_end < v_start:
        raise BusinessRuleValidationError(
            "End date must be greater than or equal to start date.",
            fields={"end_date": ["End date cannot be before start date."]}
        )

    old_status = log.status
    old_vehicle = log.vehicle

    if status_val == 'active' and old_status != 'active':
        if vehicle.status == 'retired':
            raise BusinessRuleValidationError("Retired vehicles cannot be put in maintenance.")
        elif vehicle.status == 'on_trip':
            raise BusinessRuleValidationError("Vehicles currently on trip cannot be put in maintenance.")

    history_entry = f"[{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}] Updated details by {user.email}"
    if old_status != status_val:
        history_entry += f" | Status changed: {old_status.upper()} -> {status_val.upper()}"
    
    log.history = (log.history or "") + history_entry + "\n"

    for field, val in data.items():
        setattr(log, field, val)

    if service_type:
        log.service_type = service_type
        log.maintenance_type = service_type

    log.updated_by = user
    log.save()

    # Sync Vehicle status
    if status_val == 'active':
        if old_vehicle != vehicle and old_vehicle.status == 'in_shop':
            old_vehicle.status = 'available'
            old_vehicle.save()
        vehicle.status = 'in_shop'
        vehicle.save()
    elif status_val in ['completed', 'closed', 'cancelled'] and old_status == 'active':
        if vehicle.status == 'in_shop':
            vehicle.status = 'available' if vehicle.status != 'retired' else 'retired'
            vehicle.save()
    elif status_val == 'scheduled' and old_status == 'active':
        if vehicle.status == 'in_shop':
            vehicle.status = 'available' if vehicle.status != 'retired' else 'retired'
            vehicle.save()

    return log

def close_maintenance_log(log_id, user=None):
    """
    Business action to close a maintenance log.
    Restores the vehicle's status to 'available' unless it was retired.
    """
    try:
        log = MaintenanceLog.objects.get(id=log_id)
    except MaintenanceLog.DoesNotExist:
        raise BusinessRuleValidationError("Maintenance log not found.")
        
    if log.status in ['completed', 'closed', 'cancelled']:
        raise StateTransitionConflict(f"This maintenance log is already {log.status}.")
        
    old_status = log.status
    log.status = 'closed'
    log.closed_at = timezone.now()
    log.end_date = timezone.now().date()
    
    user_email = user.email if user else "system"
    log.history = (log.history or "") + f"[{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}] Maintenance closed successfully by {user_email}\n"
    if user:
        log.updated_by = user
    log.save()
    
    vehicle = log.vehicle
    if vehicle.status == 'in_shop':
        vehicle.status = 'available' if vehicle.status != 'retired' else 'retired'
        vehicle.save()
        
    return log

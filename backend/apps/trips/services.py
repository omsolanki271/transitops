from django.utils import timezone
import datetime
import decimal

from core.exceptions import BusinessRuleValidationError, StateTransitionConflict
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from .models import Trip

def validate_trip_assignment(vehicle, driver, cargo_weight, is_dispatch=False, trip_id=None):
    """
    Validates vehicle, driver, and cargo assignments for a trip.
    This is executed at trip creation/update and re-run during dispatch.
    """
    # 1. Cargo weight check
    if cargo_weight > vehicle.max_load_capacity:
        raise BusinessRuleValidationError(
            "Cargo weight exceeds vehicle maximum load capacity.",
            fields={"cargo_weight": [f"Weight ({cargo_weight} kg) exceeds vehicle capacity ({vehicle.max_load_capacity} kg)."]}
        )
    
    # 2. Vehicle availability check
    if vehicle.status == 'retired':
        raise BusinessRuleValidationError(
            "Vehicle cannot be assigned: Vehicle is retired.",
            fields={"vehicle": ["Vehicle is retired."]}
        )
    elif vehicle.status == 'in_shop':
        raise BusinessRuleValidationError(
            "Vehicle cannot be assigned: Vehicle is in shop for maintenance.",
            fields={"vehicle": ["Vehicle is in shop."]}
        )
    
    # If dispatching (or if we are checking active availability), check if resource is already on a trip
    # If the vehicle is currently on a trip and it is NOT this trip, reject.
    if vehicle.status == 'on_trip':
        # Check if there is an active trip on this vehicle that is not the current one
        active_trips = Trip.objects.filter(vehicle=vehicle, status='dispatched')
        if trip_id:
            active_trips = active_trips.exclude(id=trip_id)
        if active_trips.exists():
            raise BusinessRuleValidationError(
                "Vehicle already on trip cannot receive another trip.",
                fields={"vehicle": ["Vehicle is currently assigned to another active trip."]}
            )

    # 3. Driver availability & compliance checks
    if driver.license_expiry_date < datetime.date.today():
        raise BusinessRuleValidationError(
            "Driver cannot be assigned: License has expired.",
            fields={"driver": ["Driver license is expired."]}
        )
    if driver.status == 'suspended':
        raise BusinessRuleValidationError(
            "Driver cannot be assigned: Driver is suspended.",
            fields={"driver": ["Driver is suspended."]}
        )
    if driver.status == 'off_duty':
        raise BusinessRuleValidationError(
            "Driver cannot be assigned: Driver is off duty.",
            fields={"driver": ["Driver is currently off duty."]}
        )
    
    if driver.status == 'on_trip':
        # Check if there is an active trip on this driver that is not the current one
        active_trips = Trip.objects.filter(driver=driver, status='dispatched')
        if trip_id:
            active_trips = active_trips.exclude(id=trip_id)
        if active_trips.exists():
            raise BusinessRuleValidationError(
                "Driver already on trip cannot receive another trip.",
                fields={"driver": ["Driver is currently assigned to another active trip."]}
            )

def create_trip(data, user):
    """
    Business service to create a trip in Draft status.
    """
    vehicle = data.get('vehicle')
    driver = data.get('driver')
    cargo_weight = data.get('cargo_weight')
    planned_distance = data.get('planned_distance')
    
    # Enforce positive inputs
    if cargo_weight <= 0:
        raise BusinessRuleValidationError("Cargo weight must be positive.", fields={"cargo_weight": ["Must be greater than 0."]})
    if planned_distance <= 0:
        raise BusinessRuleValidationError("Planned distance must be positive.", fields={"planned_distance": ["Must be greater than 0."]})
    if data.get('revenue', 0) < 0:
        raise BusinessRuleValidationError("Revenue must be positive.", fields={"revenue": ["Must be 0 or positive."]})

    validate_trip_assignment(vehicle, driver, cargo_weight)
    
    # Save the creator user
    data['created_by'] = user
    data['status'] = 'draft'
    
    return Trip.objects.create(**data)

def update_trip(trip, data):
    """
    Business service to update a trip. Can only be updated if status is Draft.
    """
    if trip.status != 'draft':
        raise StateTransitionConflict("Only draft trips can be updated.")
        
    vehicle = data.get('vehicle', trip.vehicle)
    driver = data.get('driver', trip.driver)
    cargo_weight = data.get('cargo_weight', trip.cargo_weight)
    planned_distance = data.get('planned_distance', trip.planned_distance)
    
    if cargo_weight <= 0:
        raise BusinessRuleValidationError("Cargo weight must be positive.", fields={"cargo_weight": ["Must be greater than 0."]})
    if planned_distance <= 0:
        raise BusinessRuleValidationError("Planned distance must be positive.", fields={"planned_distance": ["Must be greater than 0."]})
    if data.get('revenue', 0) < 0:
        raise BusinessRuleValidationError("Revenue must be positive.", fields={"revenue": ["Must be 0 or positive."]})

    validate_trip_assignment(vehicle, driver, cargo_weight, trip_id=trip.id)
    
    for k, v in data.items():
        setattr(trip, k, v)
    trip.save()
    return trip

def dispatch_trip(trip_id):
    """
    Business action to dispatch a trip.
    Enforces that trip status is 'draft', re-runs validations,
    and updates vehicle & driver status to 'on_trip'.
    """
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        raise BusinessRuleValidationError("Trip not found.")
        
    if trip.status != 'draft':
        raise StateTransitionConflict(f"Cannot dispatch a trip in '{trip.status}' status. It must be in 'draft'.")
        
    # Re-run availability and compliance checks at dispatch time
    validate_trip_assignment(trip.vehicle, trip.driver, trip.cargo_weight, is_dispatch=True, trip_id=trip.id)
    
    # Update statuses
    trip.status = 'dispatched'
    trip.dispatched_at = timezone.now()
    trip.save()
    
    # Set vehicle and driver status to on_trip
    vehicle = trip.vehicle
    vehicle.status = 'on_trip'
    vehicle.save()
    
    driver = trip.driver
    driver.status = 'on_trip'
    driver.save()
    
    return trip

def complete_trip(trip_id, final_odometer, fuel_consumed, actual_distance):
    """
    Business action to complete a trip.
    Validates odometer reading, fuel consumption, and updates vehicle & driver.
    """
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        raise BusinessRuleValidationError("Trip not found.")
        
    if trip.status != 'dispatched':
        raise StateTransitionConflict(f"Cannot complete a trip in '{trip.status}' status. It must be in 'dispatched'.")
        
    # Validate positive inputs
    try:
        dec_odom = decimal.Decimal(str(final_odometer))
        dec_fuel = decimal.Decimal(str(fuel_consumed))
        dec_dist = decimal.Decimal(str(actual_distance))
        
        if dec_odom <= 0 or dec_fuel <= 0 or dec_dist <= 0:
            raise BusinessRuleValidationError(
                "Odometer, fuel, and distance values must be positive.",
                fields={
                    "final_odometer": ["Must be positive."] if dec_odom <= 0 else [],
                    "fuel_consumed": ["Must be positive."] if dec_fuel <= 0 else [],
                    "actual_distance": ["Must be positive."] if dec_dist <= 0 else []
                }
            )
    except (ValueError, decimal.InvalidOperation):
        raise BusinessRuleValidationError("Odometer, fuel, and distance must be valid decimal numbers.")

    vehicle = trip.vehicle
    # Odometer check
    if dec_odom < vehicle.odometer:
        raise BusinessRuleValidationError(
            "Final odometer cannot be less than the vehicle's current odometer.",
            fields={"final_odometer": [f"Must be at least the current vehicle odometer: {vehicle.odometer} km."]}
        )
        
    # Update Trip
    trip.status = 'completed'
    trip.completed_at = timezone.now()
    trip.final_odometer = dec_odom
    trip.fuel_consumed = dec_fuel
    trip.actual_distance = dec_dist
    trip.save()
    
    # Update Vehicle
    vehicle.odometer = dec_odom
    # Restore status to available, unless it was retired while on trip
    if vehicle.status != 'retired':
        vehicle.status = 'available'
    vehicle.save()
    
    # Restore Driver
    driver = trip.driver
    if driver.status != 'suspended':
        driver.status = 'available'
    driver.save()
    
    return trip

def cancel_trip(trip_id):
    """
    Business action to cancel a trip.
    If dispatched, restores vehicle and driver availability.
    """
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        raise BusinessRuleValidationError("Trip not found.")
        
    if trip.status not in ['draft', 'dispatched']:
        raise StateTransitionConflict(f"Cannot cancel a trip in '{trip.status}' status. Must be in 'draft' or 'dispatched'.")
        
    original_status = trip.status
    
    trip.status = 'cancelled'
    trip.cancelled_at = timezone.now()
    trip.save()
    
    # Restore resources if they were already dispatched
    if original_status == 'dispatched':
        vehicle = trip.vehicle
        if vehicle.status == 'on_trip':
            vehicle.status = 'available'
            vehicle.save()
            
        driver = trip.driver
        if driver.status == 'on_trip':
            driver.status = 'available'
            driver.save()
            
    return trip

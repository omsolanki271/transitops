from core.exceptions import BusinessRuleValidationError
from .models import Vehicle

def validate_registration_number(registration_number, exclude_id=None):
    """
    Validates that a vehicle registration number is unique.
    """
    qs = Vehicle.objects.filter(registration_number=registration_number)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    if qs.exists():
        raise BusinessRuleValidationError(
            "Vehicle registration number must be unique.",
            fields={"registration_number": ["A vehicle with this registration number already exists."]}
        )

def validate_positive_fields(data):
    """
    Validates that numeric fields are positive.
    """
    for field in ['max_load_capacity', 'odometer', 'acquisition_cost']:
        val = data.get(field)
        if val is not None:
            try:
                import decimal
                dec_val = decimal.Decimal(str(val))
                if dec_val < 0:
                    raise BusinessRuleValidationError(
                        f"{field} must be positive.",
                        fields={field: ["Must be a positive value."]}
                    )
            except (ValueError, decimal.InvalidOperation):
                raise BusinessRuleValidationError(
                    f"{field} must be a valid number.",
                    fields={field: ["Must be a valid decimal number."]}
                )

def create_vehicle(data):
    """
    Business service to create a vehicle with rule checks.
    """
    validate_registration_number(data.get('registration_number'))
    validate_positive_fields(data)
    return Vehicle.objects.create(**data)

def update_vehicle(vehicle, data):
    """
    Business service to update a vehicle with rule checks.
    """
    if 'registration_number' in data:
        validate_registration_number(data['registration_number'], exclude_id=vehicle.id)
    validate_positive_fields(data)
    
    for k, v in data.items():
        setattr(vehicle, k, v)
    vehicle.save()
    return vehicle

def get_available_vehicles_for_dispatch():
    """
    Returns vehicles that are available for dispatch (excludes retired or in_shop status).
    """
    return Vehicle.objects.exclude(status__in=['retired', 'in_shop'])

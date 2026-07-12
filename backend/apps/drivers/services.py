import datetime
from core.exceptions import BusinessRuleValidationError
from .models import Driver

def validate_license_number(license_number, exclude_id=None):
    """
    Validates that a driver license number is unique.
    """
    qs = Driver.objects.filter(license_number=license_number)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    if qs.exists():
        raise BusinessRuleValidationError(
            "Driver license number must be unique.",
            fields={"license_number": ["A driver with this license number already exists."]}
        )

def validate_driver_assignable(driver):
    """
    Validates if the driver can be assigned to a trip.
    Checks that the license is not expired and the status is available.
    """
    # Check if license is expired
    if driver.license_expiry_date < datetime.date.today():
        raise BusinessRuleValidationError(
            "Driver cannot be assigned: License has expired.",
            fields={"driver": ["Driver license is expired."]}
        )
    
    # Check status
    if driver.status == 'suspended':
        raise BusinessRuleValidationError(
            "Driver cannot be assigned: Driver is suspended.",
            fields={"driver": ["Driver is currently suspended."]}
        )
    if driver.status == 'on_trip':
        raise BusinessRuleValidationError(
            "Driver cannot be assigned: Driver is already on a trip.",
            fields={"driver": ["Driver is already assigned to an active trip."]}
        )
    if driver.status == 'off_duty':
        raise BusinessRuleValidationError(
            "Driver cannot be assigned: Driver is off duty.",
            fields={"driver": ["Driver is currently off duty."]}
        )

def create_driver(data):
    """
    Service to create driver with license number validation.
    """
    validate_license_number(data.get('license_number'))
    return Driver.objects.create(**data)

def update_driver(driver, data):
    """
    Service to update driver with license number validation.
    """
    if 'license_number' in data:
        validate_license_number(data['license_number'], exclude_id=driver.id)
    
    for k, v in data.items():
        setattr(driver, k, v)
    driver.save()
    return driver

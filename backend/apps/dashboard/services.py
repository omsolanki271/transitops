from apps.vehicles.models import Vehicle
from apps.trips.models import Trip
from apps.drivers.models import Driver

def calculate_dashboard_summary(vehicle_type=None, status=None, region=None):
    """
    Calculates dashboard KPIs based on vehicle-level filters (vehicle_type, status, region).
    The filters cascade down to filter corresponding trips and on-duty drivers.
    """
    vehicles = Vehicle.objects.all()

    if vehicle_type:
        vehicles = vehicles.filter(vehicle_type=vehicle_type)
    if status:
        vehicles = vehicles.filter(status=status)
    if region:
        vehicles = vehicles.filter(region=region)

    total_vehicles = vehicles.count()
    active_vehicles = vehicles.filter(status='on_trip').count()
    available_vehicles = vehicles.filter(status='available').count()
    vehicles_in_maintenance = vehicles.filter(status='in_shop').count()

    # Contextual trip filters
    trips = Trip.objects.filter(vehicle__in=vehicles)
    active_trips = trips.filter(status='dispatched').count()
    pending_trips = trips.filter(status='draft').count()

    # On-duty drivers are those associated with dispatched trips on the filtered vehicles
    drivers_on_duty = Driver.objects.filter(
        trips__vehicle__in=vehicles,
        trips__status='dispatched'
    ).distinct().count()

    # utilization calculation
    fleet_utilization_percent = 0.00
    if total_vehicles > 0:
        fleet_utilization_percent = round((active_vehicles / total_vehicles) * 100, 2)

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_in_maintenance": vehicles_in_maintenance,
        "vehicles_in_shop": vehicles_in_maintenance,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization_percent": fleet_utilization_percent,
        "fleet_utilization": fleet_utilization_percent,
        "fuel_cost": 0,
        "maintenance_cost": 0,
        "operational_cost": 0,
        "revenue": 0,
        "roi": 0
    }

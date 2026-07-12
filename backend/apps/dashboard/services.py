from django.db.models import Sum
from apps.vehicles.models import Vehicle
from apps.trips.models import Trip
from apps.drivers.models import Driver
from apps.fuel_expenses.models import FuelLog, Expense
from apps.maintenance.models import MaintenanceLog

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

    # Dynamic financial rollups
    fuel_cost = FuelLog.objects.filter(vehicle__in=vehicles).aggregate(total=Sum('cost'))['total'] or 0
    maintenance_cost = MaintenanceLog.objects.filter(vehicle__in=vehicles).exclude(status='cancelled').aggregate(total=Sum('cost'))['total'] or 0
    other_expenses = Expense.objects.filter(vehicle__in=vehicles).aggregate(total=Sum('amount'))['total'] or 0

    operational_cost = fuel_cost + maintenance_cost + other_expenses
    revenue = trips.filter(status='completed').aggregate(total=Sum('revenue'))['total'] or 0

    total_acquisition_cost = vehicles.aggregate(total=Sum('acquisition_cost'))['total'] or 0
    roi = 0.00
    if total_acquisition_cost > 0:
        roi = round(float((revenue - (maintenance_cost + fuel_cost)) / total_acquisition_cost) * 100, 2)

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
        "fuel_cost": float(fuel_cost),
        "maintenance_cost": float(maintenance_cost),
        "operational_cost": float(operational_cost),
        "revenue": float(revenue),
        "roi": float(roi)
    }

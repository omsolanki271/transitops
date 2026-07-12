import csv
import decimal
from django.db.models import Sum

from apps.vehicles.models import Vehicle
from apps.trips.models import Trip
from apps.maintenance.models import MaintenanceLog
from apps.fuel_expenses.models import FuelLog, Expense
from apps.fuel_expenses.services import get_vehicle_cost_rollup

def get_vehicle_performance_report():
    """
    Business service to aggregate performance metrics for each vehicle:
    - Fuel Efficiency: total actual distance / total fuel consumed (on completed trips)
    - Operational Cost rollup
    - Revenue
    - Vehicle ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    """
    vehicles = Vehicle.objects.all()
    report_data = []

    for vehicle in vehicles:
        # Fetch cost rollup metrics (fuel, maintenance, other expenses)
        rollup = get_vehicle_cost_rollup(vehicle.id)
        if not rollup:
            continue
            
        completed_trips = Trip.objects.filter(vehicle=vehicle, status='completed')
        
        # Aggregate distance and fuel values
        total_distance = completed_trips.aggregate(total=Sum('actual_distance'))['total'] or decimal.Decimal('0.00')
        total_fuel = completed_trips.aggregate(total=Sum('fuel_consumed'))['total'] or decimal.Decimal('0.00')
        
        fuel_efficiency = decimal.Decimal('0.00')
        if total_fuel > 0:
            fuel_efficiency = round(total_distance / total_fuel, 2)
            
        # Aggregate revenue
        total_revenue = completed_trips.aggregate(total=Sum('revenue'))['total'] or decimal.Decimal('0.00')
        
        # Calculate ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
        # ROI is in ratio format, and roi_percent is in percentage format
        maintenance_cost = rollup['maintenance_cost']
        fuel_cost = rollup['fuel_cost']
        total_maintenance_fuel_cost = maintenance_cost + fuel_cost
        
        roi = decimal.Decimal('0.00')
        if vehicle.acquisition_cost > 0:
            roi = round((total_revenue - total_maintenance_fuel_cost) / vehicle.acquisition_cost, 4)
            
        report_data.append({
            "vehicle_id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "name_model": vehicle.name_model,
            "fuel_efficiency_km_l": fuel_efficiency,
            "total_distance_km": total_distance,
            "total_fuel_l": total_fuel,
            "total_revenue": total_revenue,
            "fuel_cost": fuel_cost,
            "maintenance_cost": maintenance_cost,
            "other_expenses": rollup['other_expenses'],
            "total_operational_cost": rollup['total_operational_cost'],
            "acquisition_cost": vehicle.acquisition_cost,
            "roi_ratio": roi,
            "roi_percent": round(roi * 100, 2)
        })
        
    return report_data

class Echo:
    """An object that implements just the write method of the file-like interface
    to yield raw lines for StreamingHttpResponse.
    """
    def write(self, value):
        return value

def generate_csv_report(report_type):
    """
    Streams a CSV file content based on report type.
    """
    if report_type == 'vehicle_performance' or report_type == 'roi' or report_type == 'fuel_efficiency':
        data = get_vehicle_performance_report()
        headers = [
            'Vehicle ID', 'Registration Number', 'Model', 'Fuel Efficiency (km/L)',
            'Total Distance (km)', 'Total Fuel Used (L)', 'Total Revenue ($)',
            'Fuel Cost ($)', 'Maintenance Cost ($)', 'Other Expenses ($)', 'Total Operational Cost ($)',
            'Acquisition Cost ($)', 'ROI (%)'
        ]
        
        def rows():
            yield headers
            for item in data:
                yield [
                    item['vehicle_id'],
                    item['registration_number'],
                    item['name_model'],
                    item['fuel_efficiency_km_l'],
                    item['total_distance_km'],
                    item['total_fuel_l'],
                    item['total_revenue'],
                    item['fuel_cost'],
                    item['maintenance_cost'],
                    item['other_expenses'],
                    item['total_operational_cost'],
                    item['acquisition_cost'],
                    item['roi_percent']
                ]
        
        echo_buffer = Echo()
        writer = csv.writer(echo_buffer)
        response_generator = (writer.writerow(row) for row in rows())
        return response_generator, 'vehicle_performance_report.csv'
        
    elif report_type == 'fleet_utilization':
        # Summary list of vehicles and their status
        vehicles = Vehicle.objects.all()
        headers = ['Registration Number', 'Model', 'Vehicle Type', 'Status', 'Region', 'Odometer (km)']
        
        def rows():
            yield headers
            for v in vehicles:
                yield [v.registration_number, v.name_model, v.vehicle_type, v.status, v.region, v.odometer]
                
        echo_buffer = Echo()
        writer = csv.writer(echo_buffer)
        response_generator = (writer.writerow(row) for row in rows())
        return response_generator, 'fleet_utilization_report.csv'
        
    else:
        headers = ['Error']
        def rows():
            yield headers
            yield ['Invalid report type requested. Available: vehicle_performance, fleet_utilization.']
            
        echo_buffer = Echo()
        writer = csv.writer(echo_buffer)
        response_generator = (writer.writerow(row) for row in rows())
        return response_generator, 'error_report.csv'

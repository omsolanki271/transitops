from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime
import decimal

from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip
from apps.maintenance.models import MaintenanceLog
from apps.fuel_expenses.models import FuelLog, Expense

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with test data for TransitOps'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data...')
        FuelLog.objects.all().delete()
        Expense.objects.all().delete()
        Trip.objects.all().delete()
        MaintenanceLog.objects.all().delete()
        Driver.objects.all().delete()
        User.objects.all().delete()
        Vehicle.objects.all().delete()

        self.stdout.write('Creating users...')
        # Fleet Manager
        manager = User.objects.create_user(
            email='fleet@transitops.com',
            password='password123',
            full_name='Ashish Kalsara (Fleet Manager)',
            role='fleet_manager',
            phone='1234567890'
        )
        
        # Dispatcher
        dispatcher_user = User.objects.create_user(
            email='dispatcher@transitops.com',
            password='password123',
            full_name='John Doe (Dispatcher)',
            role='dispatcher',
            phone='9876543210'
        )

        # Safety Officer
        safety = User.objects.create_user(
            email='safety@transitops.com',
            password='password123',
            full_name='Jane Smith (Safety Officer)',
            role='safety_officer',
            phone='5551234567'
        )

        # Financial Analyst
        finance = User.objects.create_user(
            email='finance@transitops.com',
            password='password123',
            full_name='Bob Johnson (Financial Analyst)',
            role='financial_analyst',
            phone='4449876543'
        )

        self.stdout.write('Creating vehicles...')
        v1 = Vehicle.objects.create(
            registration_number='GJ-01-XX-1234',
            name_model='Volvo FH16 Truck',
            vehicle_type='truck',
            max_load_capacity=decimal.Decimal('20000.00'),
            odometer=decimal.Decimal('15200.50'),
            acquisition_cost=decimal.Decimal('150000.00'),
            status='available',
            region='West'
        )

        v2 = Vehicle.objects.create(
            registration_number='GJ-01-YY-5678',
            name_model='Tata Prima Tipper',
            vehicle_type='truck',
            max_load_capacity=decimal.Decimal('15000.00'),
            odometer=decimal.Decimal('8500.20'),
            acquisition_cost=decimal.Decimal('90000.00'),
            status='on_trip',
            region='West'
        )

        v3 = Vehicle.objects.create(
            registration_number='MH-02-ZZ-9999',
            name_model='Mahindra Bolero Pickup',
            vehicle_type='pickup',
            max_load_capacity=decimal.Decimal('1500.00'),
            odometer=decimal.Decimal('25600.00'),
            acquisition_cost=decimal.Decimal('25000.00'),
            status='in_shop',
            region='South'
        )

        v4 = Vehicle.objects.create(
            registration_number='DL-03-AA-1111',
            name_model='Force Traveller Cargo',
            vehicle_type='van',
            max_load_capacity=decimal.Decimal('3500.00'),
            odometer=decimal.Decimal('45300.10'),
            acquisition_cost=decimal.Decimal('30000.00'),
            status='retired',
            region='North'
        )

        self.stdout.write('Creating drivers...')
        d1 = Driver.objects.create(
            user=dispatcher_user,
            name='John Doe',
            license_number='DL-2023-0001',
            license_category='heavy_vehicle',
            license_expiry_date=datetime.date.today() + datetime.timedelta(days=365),
            contact_number='9876543210',
            safety_score=decimal.Decimal('95.50'),
            status='available'
        )

        d2 = Driver.objects.create(
            user=None,
            name='Richard Roe',
            license_number='DL-2023-0002',
            license_category='heavy_vehicle',
            license_expiry_date=datetime.date.today() + datetime.timedelta(days=180),
            contact_number='9876543211',
            safety_score=decimal.Decimal('88.20'),
            status='on_trip'
        )

        d3 = Driver.objects.create(
            user=None,
            name='Expired License Driver',
            license_number='DL-2020-9999',
            license_category='light_vehicle',
            license_expiry_date=datetime.date.today() - datetime.timedelta(days=30),
            contact_number='9876543212',
            safety_score=decimal.Decimal('75.00'),
            status='available'
        )

        d4 = Driver.objects.create(
            user=None,
            name='Suspended Driver',
            license_number='DL-2019-8888',
            license_category='heavy_vehicle',
            license_expiry_date=datetime.date.today() + datetime.timedelta(days=200),
            contact_number='9876543213',
            safety_score=decimal.Decimal('45.00'),
            status='suspended'
        )

        self.stdout.write('Creating trips...')
        # Draft trip
        t1 = Trip.objects.create(
            source='Mumbai',
            destination='Pune',
            vehicle=v1,
            driver=d1,
            cargo_weight=decimal.Decimal('12000.00'),
            planned_distance=decimal.Decimal('150.00'),
            status='draft',
            created_by=manager,
            revenue=decimal.Decimal('2000.00')
        )

        # Dispatched trip (v2 & d2 are on_trip)
        t2 = Trip.objects.create(
            source='Ahmedabad',
            destination='Baroda',
            vehicle=v2,
            driver=d2,
            cargo_weight=decimal.Decimal('8000.00'),
            planned_distance=decimal.Decimal('120.00'),
            status='dispatched',
            created_by=manager,
            dispatched_at=timezone.now() - datetime.timedelta(hours=2),
            revenue=decimal.Decimal('1500.00')
        )

        # Completed trip
        t3 = Trip.objects.create(
            source='Surat',
            destination='Mumbai',
            vehicle=v1,
            driver=d1,
            cargo_weight=decimal.Decimal('15000.00'),
            planned_distance=decimal.Decimal('280.00'),
            actual_distance=decimal.Decimal('285.50'),
            final_odometer=decimal.Decimal('15200.50'),
            fuel_consumed=decimal.Decimal('95.00'),
            status='completed',
            created_by=manager,
            dispatched_at=timezone.now() - datetime.timedelta(days=2, hours=5),
            completed_at=timezone.now() - datetime.timedelta(days=2),
            revenue=decimal.Decimal('4500.00')
        )

        self.stdout.write('Creating maintenance logs...')
        # Closed maintenance
        m1 = MaintenanceLog.objects.create(
            vehicle=v1,
            maintenance_type='Engine Tuning',
            description='Standard engine tune-up and inspection.',
            cost=decimal.Decimal('850.00'),
            status='closed',
            started_at=timezone.now() - datetime.timedelta(days=10),
            closed_at=timezone.now() - datetime.timedelta(days=9),
            created_by=manager
        )

        # Active maintenance (v3 is in_shop)
        m2 = MaintenanceLog.objects.create(
            vehicle=v3,
            maintenance_type='Brake Overhaul',
            description='Replacing front brake pads and discs.',
            cost=decimal.Decimal('450.00'),
            status='active',
            started_at=timezone.now() - datetime.timedelta(days=1),
            created_by=manager
        )

        self.stdout.write('Creating fuel logs and expenses...')
        # Fuel log for completed trip t3
        FuelLog.objects.create(
            vehicle=v1,
            trip=t3,
            created_by=finance,
            liters=decimal.Decimal('95.00'),
            cost=decimal.Decimal('380.00'),
            log_date=datetime.date.today() - datetime.timedelta(days=2)
        )
        
        # Standalone fuel logs
        FuelLog.objects.create(
            vehicle=v1,
            trip=None,
            created_by=finance,
            liters=decimal.Decimal('120.00'),
            cost=decimal.Decimal('480.00'),
            log_date=datetime.date.today() - datetime.timedelta(days=5)
        )

        FuelLog.objects.create(
            vehicle=v2,
            trip=None,
            created_by=manager,
            liters=decimal.Decimal('60.00'),
            cost=decimal.Decimal('240.00'),
            log_date=datetime.date.today() - datetime.timedelta(days=1)
        )

        # Toll/Other Expenses
        Expense.objects.create(
            vehicle=v1,
            created_by=finance,
            expense_type='toll',
            amount=decimal.Decimal('75.00'),
            expense_date=datetime.date.today() - datetime.timedelta(days=2),
            description='National Highway Toll for Surat-Mumbai trip.'
        )

        Expense.objects.create(
            vehicle=v2,
            expense_type='other',
            amount=decimal.Decimal('50.00'),
            expense_date=datetime.date.today(),
            description='Driver food allowance.'
        )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))

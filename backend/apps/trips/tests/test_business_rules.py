from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime
import decimal

from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip
from apps.maintenance.models import MaintenanceLog
from apps.trips.services import create_trip, dispatch_trip, complete_trip, cancel_trip
from apps.maintenance.services import create_maintenance_log, close_maintenance_log
from core.exceptions import BusinessRuleValidationError, StateTransitionConflict

User = get_user_model()

class BusinessRulesTestCase(TestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            email='test_manager@transitops.com',
            password='password123',
            full_name='Test Manager',
            role='fleet_manager'
        )

        # Create vehicles
        self.vehicle_avail = Vehicle.objects.create(
            registration_number='TEST-01-V',
            name_model='Test Van',
            vehicle_type='van',
            max_load_capacity=decimal.Decimal('1000.00'),
            odometer=decimal.Decimal('100.00'),
            acquisition_cost=decimal.Decimal('20000.00'),
            status='available',
            region='West'
        )

        self.vehicle_retired = Vehicle.objects.create(
            registration_number='TEST-02-V',
            name_model='Retired Truck',
            vehicle_type='truck',
            max_load_capacity=decimal.Decimal('5000.00'),
            odometer=decimal.Decimal('5000.00'),
            acquisition_cost=decimal.Decimal('50000.00'),
            status='retired',
            region='West'
        )

        # Create drivers
        self.driver_avail = Driver.objects.create(
            name='Driver Avail',
            license_number='LIC-01',
            license_category='heavy',
            license_expiry_date=datetime.date.today() + datetime.timedelta(days=100),
            contact_number='1234',
            safety_score=decimal.Decimal('90.00'),
            status='available'
        )

        self.driver_expired = Driver.objects.create(
            name='Driver Expired',
            license_number='LIC-02',
            license_category='heavy',
            license_expiry_date=datetime.date.today() - datetime.timedelta(days=1),
            contact_number='1234',
            safety_score=decimal.Decimal('80.00'),
            status='available'
        )

        self.driver_suspended = Driver.objects.create(
            name='Driver Suspended',
            license_number='LIC-03',
            license_category='heavy',
            license_expiry_date=datetime.date.today() + datetime.timedelta(days=100),
            contact_number='1234',
            safety_score=decimal.Decimal('80.00'),
            status='suspended'
        )

    def test_cargo_weight_limit(self):
        # Cargo weight exceeding max capacity should fail
        with self.assertRaises(BusinessRuleValidationError) as ctx:
            create_trip({
                'source': 'A',
                'destination': 'B',
                'vehicle': self.vehicle_avail,
                'driver': self.driver_avail,
                'cargo_weight': decimal.Decimal('1500.00'), # limit is 1000
                'planned_distance': decimal.Decimal('50.00'),
                'revenue': decimal.Decimal('100.00')
            }, self.user)
        self.assertIn("Cargo weight exceeds vehicle maximum load capacity.", ctx.exception.message)

    def test_expired_license_assignment(self):
        # Assigning expired license driver should fail
        with self.assertRaises(BusinessRuleValidationError) as ctx:
            create_trip({
                'source': 'A',
                'destination': 'B',
                'vehicle': self.vehicle_avail,
                'driver': self.driver_expired,
                'cargo_weight': decimal.Decimal('500.00'),
                'planned_distance': decimal.Decimal('50.00'),
                'revenue': decimal.Decimal('100.00')
            }, self.user)
        self.assertIn("Driver license is expired.", str(ctx.exception.fields))

    def test_suspended_driver_assignment(self):
        # Assigning suspended driver should fail
        with self.assertRaises(BusinessRuleValidationError) as ctx:
            create_trip({
                'source': 'A',
                'destination': 'B',
                'vehicle': self.vehicle_avail,
                'driver': self.driver_suspended,
                'cargo_weight': decimal.Decimal('500.00'),
                'planned_distance': decimal.Decimal('50.00'),
                'revenue': decimal.Decimal('100.00')
            }, self.user)
        self.assertIn("Driver is suspended.", str(ctx.exception.fields))

    def test_retired_vehicle_assignment(self):
        with self.assertRaises(BusinessRuleValidationError) as ctx:
            create_trip({
                'source': 'A',
                'destination': 'B',
                'vehicle': self.vehicle_retired,
                'driver': self.driver_avail,
                'cargo_weight': decimal.Decimal('500.00'),
                'planned_distance': decimal.Decimal('50.00'),
                'revenue': decimal.Decimal('100.00')
            }, self.user)
        self.assertIn("Vehicle is retired.", str(ctx.exception.fields))

    def test_trip_dispatch_lifecycle(self):
        # Create draft trip
        trip = create_trip({
            'source': 'A',
            'destination': 'B',
            'vehicle': self.vehicle_avail,
            'driver': self.driver_avail,
            'cargo_weight': decimal.Decimal('500.00'),
            'planned_distance': decimal.Decimal('50.00'),
            'revenue': decimal.Decimal('100.00')
        }, self.user)
        self.assertEqual(trip.status, 'draft')

        # Dispatch trip
        dispatch_trip(trip.id)
        trip.refresh_from_db()
        self.assertEqual(trip.status, 'dispatched')
        
        # Vehicle and Driver should be marked as on_trip
        self.assertEqual(trip.vehicle.status, 'on_trip')
        self.assertEqual(trip.driver.status, 'on_trip')

        # Test double dispatch fails
        with self.assertRaises(StateTransitionConflict):
            dispatch_trip(trip.id)

    def test_trip_complete_lifecycle(self):
        # Create and dispatch
        trip = create_trip({
            'source': 'A',
            'destination': 'B',
            'vehicle': self.vehicle_avail,
            'driver': self.driver_avail,
            'cargo_weight': decimal.Decimal('500.00'),
            'planned_distance': decimal.Decimal('50.00'),
            'revenue': decimal.Decimal('100.00')
        }, self.user)
        dispatch_trip(trip.id)

        # Complete trip with odometer, fuel, distance
        complete_trip(trip.id, 150.00, 20.00, 50.00)
        trip.refresh_from_db()
        
        self.assertEqual(trip.status, 'completed')
        self.assertEqual(trip.final_odometer, decimal.Decimal('150.00'))
        
        # Vehicle odometer should be updated
        self.assertEqual(trip.vehicle.odometer, decimal.Decimal('150.00'))
        # Vehicle and Driver should be available
        self.assertEqual(trip.vehicle.status, 'available')
        self.assertEqual(trip.driver.status, 'available')

    def test_trip_cancel_lifecycle(self):
        # Create and dispatch
        trip = create_trip({
            'source': 'A',
            'destination': 'B',
            'vehicle': self.vehicle_avail,
            'driver': self.driver_avail,
            'cargo_weight': decimal.Decimal('500.00'),
            'planned_distance': decimal.Decimal('50.00'),
            'revenue': decimal.Decimal('100.00')
        }, self.user)
        dispatch_trip(trip.id)

        # Cancel trip
        cancel_trip(trip.id)
        trip.refresh_from_db()
        
        self.assertEqual(trip.status, 'cancelled')
        # Vehicle and Driver should be restored to available
        self.assertEqual(trip.vehicle.status, 'available')
        self.assertEqual(trip.driver.status, 'available')

    def test_maintenance_lifecycle(self):
        # Create maintenance log
        log = create_maintenance_log({
            'vehicle': self.vehicle_avail,
            'maintenance_type': 'Oil Change',
            'description': 'Regular maintenance',
            'cost': decimal.Decimal('150.00')
        }, self.user)
        
        self.assertEqual(log.status, 'active')
        # Vehicle should be marked in_shop
        self.vehicle_avail.refresh_from_db()
        self.assertEqual(self.vehicle_avail.status, 'in_shop')

        # Close maintenance log
        close_maintenance_log(log.id)
        log.refresh_from_db()
        self.assertEqual(log.status, 'closed')
        # Vehicle should be available again
        self.vehicle_avail.refresh_from_db()
        self.assertEqual(self.vehicle_avail.status, 'available')

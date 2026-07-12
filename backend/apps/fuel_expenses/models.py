from django.db import models
from apps.vehicles.models import Vehicle
from apps.trips.models import Trip

class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='fuel_logs')
    trip = models.ForeignKey(Trip, on_delete=models.PROTECT, null=True, blank=True, related_name='fuel_logs')
    liters = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    log_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"FuelLog {self.id} - {self.vehicle.registration_number} ({self.liters}L)"

class Expense(models.Model):
    EXPENSE_TYPE_CHOICES = (
        ('toll', 'Toll'),
        ('maintenance', 'Maintenance'),
        ('other', 'Other'),
    )
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='expenses')
    expense_type = models.CharField(max_length=50, choices=EXPENSE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Expense {self.id} - {self.vehicle.registration_number} ({self.expense_type})"

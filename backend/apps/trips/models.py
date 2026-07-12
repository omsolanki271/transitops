from django.db import models
from django.conf import settings
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver

class Trip(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('dispatched', 'Dispatched'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    source = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='trips')
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, related_name='trips')
    cargo_weight = models.DecimalField(max_digits=10, decimal_places=2)
    planned_distance = models.DecimalField(max_digits=10, decimal_places=2)
    
    actual_distance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    final_odometer = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fuel_consumed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_trips')
    
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Custom added field for dynamic ROI calculation (and support revenue tracking)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trip {self.id} ({self.source} -> {self.destination})"

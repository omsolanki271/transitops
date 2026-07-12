from django.db import models
from django.conf import settings
from apps.vehicles.models import Vehicle

class MaintenanceLog(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('closed', 'Closed'),
    )
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='maintenance_logs')
    maintenance_type = models.CharField(max_length=100)
    description = models.TextField()
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_maintenance_logs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Maintenance {self.id} - {self.vehicle.registration_number}"

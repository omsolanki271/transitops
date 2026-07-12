from django.db import models
from django.conf import settings
from apps.vehicles.models import Vehicle

class MaintenanceLog(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='maintenance_logs')
    maintenance_type = models.CharField(max_length=100)
    service_type = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField()
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_maintenance_logs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_maintenance_logs')
    updated_at = models.DateTimeField(auto_now=True)

    # Expanded details
    workshop = models.CharField(max_length=255, null=True, blank=True)
    mechanic = models.CharField(max_length=255, null=True, blank=True)
    priority = models.CharField(max_length=50, choices=PRIORITY_CHOICES, default='medium')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    attachments = models.CharField(max_length=255, null=True, blank=True)
    history = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.service_type and not self.maintenance_type:
            self.maintenance_type = self.service_type
        elif self.maintenance_type and not self.service_type:
            self.service_type = self.maintenance_type
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Maintenance {self.id} - {self.vehicle.registration_number}"

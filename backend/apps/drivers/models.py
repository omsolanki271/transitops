from django.db import models
from django.conf import settings

class Driver(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('off_duty', 'Off Duty'),
        ('suspended', 'Suspended'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='driver_profile'
    )
    name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True)
    license_category = models.CharField(max_length=50)
    license_expiry_date = models.DateField()
    contact_number = models.CharField(max_length=50)
    safety_score = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.license_number})"

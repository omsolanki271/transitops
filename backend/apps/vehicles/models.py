from django.db import models

class Vehicle(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('in_shop', 'In Shop'),
        ('retired', 'Retired'),
    )
    
    registration_number = models.CharField(max_length=50, unique=True, db_index=True)
    name_model = models.CharField(max_length=255)
    vehicle_type = models.CharField(max_length=100)
    max_load_capacity = models.DecimalField(max_digits=10, decimal_places=2)
    odometer = models.DecimalField(max_digits=10, decimal_places=2)
    acquisition_cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='available')
    region = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.registration_number} - {self.name_model}"

class Document(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='documents')
    document_type = models.CharField(max_length=100)
    file = models.FileField(upload_to='documents/')
    expiry_date = models.DateField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_type} - {self.vehicle.registration_number}"

#users/models.py
from django.db import models
from django.contrib.auth.models import User

class UserSpecs(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='specs')
    cpu_model = models.CharField(max_length=200, default="Unknown CPU")
    gpu_model = models.CharField(max_length=200, default="Unknown GPU")
    ram_gb = models.FloatField(default=0)
    storage_gb = models.FloatField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.cpu_model} + {self.gpu_model}"

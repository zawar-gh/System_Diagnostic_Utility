# users/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserSpecs(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='specs')
    cpu_model = models.CharField(max_length=200, default="Unknown CPU")
    gpu_model = models.CharField(max_length=200, default="Unknown GPU")
    ram_gb = models.FloatField(default=0.0)
    storage_gb = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.cpu_model} / {self.gpu_model} ({self.ram_gb}GB)"
    
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
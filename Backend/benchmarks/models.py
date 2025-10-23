#benchmarks/models.py
from django.db import models
from django.contrib.auth.models import User

class Benchmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='benchmarks')
    type = models.CharField(max_length=50)  # e.g., Gaming, Office, AI
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.timestamp}"

class BenchmarkMetric(models.Model):
    benchmark = models.ForeignKey(Benchmark, on_delete=models.CASCADE, related_name='metrics')
    time = models.IntegerField()  # time in seconds or measurement point
    cpu = models.FloatField()     # CPU usage %
    gpu = models.FloatField()     # GPU usage %
    temp = models.FloatField()    # Temperature in Celsius

    def __str__(self):
        return f"{self.benchmark.type} - t:{self.time}s CPU:{self.cpu}% GPU:{self.gpu}%"

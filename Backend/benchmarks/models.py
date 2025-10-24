#benchmarks/models.py
from django.db import models
from django.contrib.auth.models import User

class Benchmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='benchmarks')
    type = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)

    # 🔹 Hardware snapshot for comparison
    cpu_model = models.CharField(max_length=200, default="Unknown CPU")
    gpu_model = models.CharField(max_length=200, default="Unknown GPU")
    ram_gb = models.FloatField(default=0)

    # 🔹 Performance results
    cpu_score = models.FloatField(default=0)
    gpu_score = models.FloatField(default=0)
    overall_score = models.FloatField(default=0)
    avg_temp = models.FloatField(default=0)

    def __str__(self):
        return f"{self.user.username} | {self.cpu_model} + {self.gpu_model} | {self.overall_score:.1f}"


class BenchmarkMetric(models.Model):
    benchmark = models.ForeignKey(Benchmark, on_delete=models.CASCADE, related_name='metrics')
    time = models.IntegerField()  # time in seconds or measurement point
    cpu = models.FloatField()     # CPU usage %
    gpu = models.FloatField()     # GPU usage %
    temp = models.FloatField()    # Temperature in Celsius

    def __str__(self):
        return f"{self.benchmark.type} - t:{self.time}s CPU:{self.cpu}% GPU:{self.gpu}%"

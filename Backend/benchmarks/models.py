#benchmark/models
from django.db import models
from django.contrib.auth.models import User


class Benchmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='benchmarks')
    type = models.CharField(max_length=50)  # "cpu", "gpu", "hybrid", "ram", "disk"
    timestamp = models.DateTimeField(auto_now_add=True)

    # --- Hardware Snapshot ---
    cpu_model = models.CharField(max_length=200, default="Unknown CPU")
    gpu_model = models.CharField(max_length=200, default="Unknown GPU")
    ram_gb = models.FloatField(default=0)
    ram_type = models.CharField(max_length=100, default="Unknown")
    motherboard = models.CharField(max_length=200, default="Unknown MB")
    storage_type = models.CharField(max_length=100, default="Unknown")

    # --- Performance Scores ---
    cpu_score = models.FloatField(default=0)
    gpu_score = models.FloatField(default=0)
    ram_score = models.FloatField(default=0)
    disk_score = models.FloatField(default=0)
    overall_score = models.FloatField(default=0)

    # --- Detailed Metrics ---
    avg_temp = models.FloatField(default=0)
    ram_speed_gbps = models.FloatField(default=0)     # estimated or measured via benchmark
    disk_read_speed = models.FloatField(default=0)    # MB/s
    disk_write_speed = models.FloatField(default=0)   # MB/s
    disk_health_percent = models.FloatField(default=0)  # SSD/HDD health estimate

    def __str__(self):
        return (
            f"{self.user.username} | {self.type.upper()} | "
            f"{self.cpu_model} + {self.gpu_model} | Score: {self.overall_score:.1f}"
        )

    class Meta:
        ordering = ['-timestamp']


class BenchmarkMetric(models.Model):
    benchmark = models.ForeignKey(Benchmark, on_delete=models.CASCADE, related_name='metrics')
    time = models.IntegerField()              # time in seconds
    cpu = models.FloatField()                 # CPU usage %
    gpu = models.FloatField()                 # GPU usage %
    ram_usage = models.FloatField(default=0)  # RAM usage %
    temp = models.FloatField()                # Temperature in Celsius
    ram_speed_gbps = models.FloatField(default=0.0)
    disk_speed = models.FloatField(default=0.0)
    overall_score = models.FloatField(default=0.0)

    def __str__(self):
        return (
            f"{self.benchmark.type.upper()} @ {self.time}s | "
            f"CPU:{self.cpu:.1f}% GPU:{self.gpu:.1f}% TEMP:{self.temp:.1f}°C | "
            f"RAM:{self.ram_speed_gbps:.2f}GB/s DISK:{self.disk_speed:.1f}MB/s"
        )

# benchmarks/serializers.py
from rest_framework import serializers
from .models import Benchmark, BenchmarkMetric
from users.models import UserSpecs

class BenchmarkMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = BenchmarkMetric
        fields = [
            "time",
            "cpu",
            "gpu",
            "ram_speed_gbps",
            "disk_speed",
            "temp",
            "overall_score",
        ]


class BenchmarkSerializer(serializers.ModelSerializer):
    metrics = BenchmarkMetricSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Benchmark
        fields = "__all__"
        


class UserSpecsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSpecs
        fields = ['cpu_model', 'gpu_model', 'ram_gb', 'storage_gb', 'last_updated']

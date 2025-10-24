# benchmarks/serializers.py
from rest_framework import serializers
from .models import Benchmark, BenchmarkMetric
from users.models import UserSpecs

class BenchmarkMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = BenchmarkMetric
        fields = ['time', 'cpu', 'gpu', 'temp']

class BenchmarkSerializer(serializers.ModelSerializer):
    metrics = BenchmarkMetricSerializer(many=True, read_only=True)

    class Meta:
        model = Benchmark
        fields = [
            'id', 'type', 'timestamp', 'cpu_model', 'gpu_model', 'ram_gb',
            'cpu_score', 'gpu_score', 'overall_score', 'avg_temp', 'metrics'
        ]


class UserSpecsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSpecs
        fields = ['cpu_model', 'gpu_model', 'ram_gb', 'storage_gb', 'last_updated']

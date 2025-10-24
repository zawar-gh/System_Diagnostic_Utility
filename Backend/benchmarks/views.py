#benchmark/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Benchmark
from .serializers import BenchmarkSerializer
import random, time
from rest_framework import status
from .models import BenchmarkMetric

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_benchmark(request):
    """
    Simulate a benchmark run for the given type.
    Creates Benchmark + BenchmarkMetric entries and returns results.
    """
    user = request.user
    bench_type = request.data.get('type', 'general')

    # --- Simulate benchmark data ---
    metrics = []
    for t in [0, 30, 60]:
        metrics.append({
            "time": t,
            "cpu": round(random.uniform(20, 90), 2),
            "gpu": round(random.uniform(15, 85), 2),
            "temp": round(random.uniform(35, 75), 2),
        })
        time.sleep(0.1)  # simulate short delay (optional)

    # --- Save to database ---
    benchmark = Benchmark.objects.create(user=user, type=bench_type)
    for m in metrics:
        BenchmarkMetric.objects.create(
            benchmark=benchmark,
            time=m["time"],
            cpu=m["cpu"],
            gpu=m["gpu"],
            temp=m["temp"]
        )

    serializer = BenchmarkSerializer(benchmark)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_benchmarks(request):
    user = request.user
    benchmarks = Benchmark.objects.filter(user=user).order_by('-timestamp')
    serializer = BenchmarkSerializer(benchmarks, many=True)
    return Response(serializer.data)

# benchmarks/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Benchmark, BenchmarkMetric
from .serializers import BenchmarkSerializer
from .utils import run_cpu_stress_test, run_gpu_stress_test, get_cpu_temp, run_samples
import GPUtil, psutil, time


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_benchmark(request):
    """
    Runs a real benchmark (CPU / GPU / Hybrid)
    and returns unified data structure for frontend.
    """
    user = request.user
    bench_type = request.data.get("type", "cpu").lower()

    try:
        benchmark = Benchmark.objects.create(user=user, type=bench_type)

        cpu_result = {}
        gpu_result = {}

        if bench_type == "cpu":
            cpu_result = run_cpu_stress_test(duration_seconds=10)
        elif bench_type == "gpu":
            gpu_result = run_gpu_stress_test(duration_seconds=10)
        elif bench_type == "hybrid":
            cpu_result = run_cpu_stress_test(duration_seconds=10)
            gpu_result = run_gpu_stress_test(duration_seconds=10)

        # Read temperatures safely
        temp = get_cpu_temp() or 0.0
        gpu_usage = 0.0
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_usage = round(gpus[0].load * 100, 2)
                if not temp and hasattr(gpus[0], "temperature"):
                    temp = gpus[0].temperature or temp
        except Exception:
            pass

        # Combine CPU/GPU metrics for frontend
        metrics = [
            {
                "time": 0,
                "cpu": cpu_result.get("avg_cpu", psutil.cpu_percent(interval=1)),
                "gpu": gpu_result.get("avg_gpu", gpu_usage),
                "temp": round(temp, 2),
            }
        ]

        BenchmarkMetric.objects.create(
            benchmark=benchmark,
            time=0,
            cpu=metrics[0]["cpu"],
            gpu=metrics[0]["gpu"],
            temp=metrics[0]["temp"],
        )

        serializer = BenchmarkSerializer(benchmark)
        data = serializer.data

        # Calculate overall score
        cpu_score = round(cpu_result.get("cpu_score", 0), 2)
        gpu_score = round(gpu_result.get("gpu_score", 0), 2)
        overall_score = cpu_score + gpu_score

        data.update({
            "cpuScore": cpu_score,
            "gpuScore": gpu_score,
            "overallScore": overall_score,
            "metrics": metrics,
            "temp": temp,
        })

        return Response(data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": f"Benchmark failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def live_metrics(request):
    """Return one live system metric sample."""
    try:
        sample = run_samples(duration_seconds=1, sample_count=1)[0]
        return Response(sample, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_benchmarks(request):
    """List all user benchmarks."""
    user = request.user
    benchmarks = Benchmark.objects.filter(user=user).order_by('-timestamp')
    serializer = BenchmarkSerializer(benchmarks, many=True)
    return Response(serializer.data)

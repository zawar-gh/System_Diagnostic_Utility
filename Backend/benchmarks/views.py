from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Benchmark, BenchmarkMetric
from .serializers import BenchmarkSerializer
import psutil
import GPUtil
import time
from .utils import run_cpu_stress_test, run_gpu_stress_test, get_cpu_temp, run_samples


# 🧩 1. Unified benchmark runner
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def run_benchmark(request):
    """
    Run selected benchmark type (CPU / GPU / Hybrid) and return results.
    """
    user = request.user
    bench_type = request.data.get("type", "cpu").lower()

    try:
        # --- Create new benchmark entry ---
        benchmark = Benchmark.objects.create(user=user, type=bench_type)

        # --- Run the actual stress test ---
        if bench_type == "cpu":
            result = run_cpu_stress_test(duration_seconds=10)
        elif bench_type == "gpu":
            result = run_gpu_stress_test(duration_seconds=10)
        elif bench_type == "hybrid":
            cpu = run_cpu_stress_test(duration_seconds=10)
            gpu = run_gpu_stress_test(duration_seconds=10)
            result = {**cpu, **gpu}
        else:
            return Response(
                {"error": f"Invalid benchmark type: {bench_type}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Gather current temp and GPU stats ---
        temp = get_cpu_temp() or 0.0
        gpu_usage = 0.0
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_usage = round(gpus[0].load * 100, 2)
                if not temp:
                    temp = gpus[0].temperature
        except Exception:
            pass

        # --- Save a performance metric record ---
        BenchmarkMetric.objects.create(
            benchmark=benchmark,
            time=0,
            cpu=result.get("avg_cpu", 0),
            gpu=result.get("avg_gpu", gpu_usage),
            temp=round(temp, 2),
        )

        # --- Serialize + merge scores for frontend ---
        serializer = BenchmarkSerializer(benchmark)
        response_data = serializer.data
        response_data.update(result)
        response_data.update({"temp": temp, "gpu_usage": gpu_usage})

        return Response(response_data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": f"Benchmark failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# 🧩 2. Live metrics endpoint for frontend polling
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def live_metrics(request):
    """
    Returns one quick live sample of CPU/GPU/temp for real-time chart updates.
    """
    try:
        sample = run_samples(duration_seconds=1, sample_count=1)[0]
        return Response(sample, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 🧩 3. Fetch all benchmarks for a user
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_benchmarks(request):
    """
    Retrieve all benchmarks for the authenticated user.
    """
    user = request.user
    benchmarks = Benchmark.objects.filter(user=user).order_by("-timestamp")
    serializer = BenchmarkSerializer(benchmarks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

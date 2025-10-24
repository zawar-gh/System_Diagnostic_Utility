# benchmarks/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Benchmark, BenchmarkMetric
from .serializers import BenchmarkSerializer
import GPUtil
from .utils import run_cpu_stress_test, run_gpu_stress_test, get_cpu_temp, run_samples

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_benchmark(request):
    """
    Run selected benchmark type (cpu/gpu/hybrid), store a single summary metric row,
    and return serialized benchmark + explicit score fields for the frontend.
    """
    user = request.user
    bench_type = request.data.get('type', 'cpu').lower()

    try:
        benchmark = Benchmark.objects.create(user=user, type=bench_type)

        # run tests
        if bench_type == 'cpu':
            res_cpu = run_cpu_stress_test(duration_seconds=10)
            # build unified response
            response_scores = {
                "cpu_score": res_cpu.get("cpu_score", 0),
                "avg_cpu": res_cpu.get("avg_cpu", 0),
                "duration": res_cpu.get("duration", 0)
            }
            avg_gpu = 0.0
        elif bench_type == 'gpu':
            res_gpu = run_gpu_stress_test(duration_seconds=10)
            response_scores = {
                "gpu_score": res_gpu.get("gpu_score", 0),
                "avg_gpu": res_gpu.get("avg_gpu", 0),
                "duration": res_gpu.get("duration", 0)
            }
            response_scores["cpu_score"] = 0.0
            response_scores["avg_cpu"] = 0.0
        elif bench_type == 'hybrid':
            res_cpu = run_cpu_stress_test(duration_seconds=10)
            res_gpu = run_gpu_stress_test(duration_seconds=10)
            # merge results
            response_scores = {
                "cpu_score": res_cpu.get("cpu_score", 0),
                "avg_cpu": res_cpu.get("avg_cpu", 0),
                "gpu_score": res_gpu.get("gpu_score", 0),
                "avg_gpu": res_gpu.get("avg_gpu", 0),
                "duration": max(res_cpu.get("duration", 0), res_gpu.get("duration", 0))
            }
        else:
            return Response({"error": "Invalid benchmark type"}, status=status.HTTP_400_BAD_REQUEST)

        # snapshot temps / gpu usage for the metric row
        temp = get_cpu_temp() or 0.0
        gpu_usage = 0.0
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_usage = round(gpus[0].load * 100, 2)
                if not temp and hasattr(gpus[0], 'temperature'):
                    temp = gpus[0].temperature or temp
        except Exception:
            pass

        # Save a single BenchmarkMetric row (time=0)
        BenchmarkMetric.objects.create(
            benchmark=benchmark,
            time=0,
            cpu=response_scores.get("avg_cpu", 0) or 0,
            gpu=response_scores.get("avg_gpu", gpu_usage) or gpu_usage,
            temp=round(temp, 2)
        )

        # Serialize benchmark and attach the scores explicitly for frontend
        serializer = BenchmarkSerializer(benchmark)
        data = serializer.data
        # attach score keys so frontend can read them easily
        data.update(response_scores)
        data.update({"temp": round(temp, 2), "gpu_usage": gpu_usage})

        return Response(data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def live_metrics(request):
    """
    Return a single quick sample for frontend polling.
    """
    try:
        sample = run_samples(duration_seconds=1, sample_count=1)[0]
        return Response(sample, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_benchmarks(request):
    user = request.user
    benchmarks = Benchmark.objects.filter(user=user).order_by('-timestamp')
    serializer = BenchmarkSerializer(benchmarks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

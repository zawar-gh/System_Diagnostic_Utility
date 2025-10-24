# benchmarks/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Benchmark, BenchmarkMetric
from .serializers import BenchmarkSerializer
from .utils import run_cpu_stress_test, run_gpu_stress_test, get_cpu_temp, run_samples
import GPUtil, psutil, time
from diagnostics.utils import system_collector
from diagnostics.utils.bottleneck_analyzer import analyze_bottlenecks

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_benchmark(request):
    """
    Run benchmark, store hardware snapshot, calculate performance,
    and compare results globally among identical systems.
    """
    user = request.user
    bench_type = request.data.get("type", "cpu").lower()

    try:
        # --- Step 1: Capture system specs snapshot ---
        sysinfo = system_collector()
        cpu_model = sysinfo.get("cpu", {}).get("model", "Unknown CPU")
        gpu_model = sysinfo.get("gpu", {}).get("model", "Unknown GPU")
        ram_gb = float(str(sysinfo.get("ram", {}).get("total", "0")).split()[0])

        # --- Step 2: Run stress tests ---
        cpu_result = run_cpu_stress_test(duration_seconds=10)
        gpu_result = run_gpu_stress_test(duration_seconds=10) if bench_type in ["gpu", "hybrid"] else {}

        # --- Step 3: Read temperature safely ---
        temp = get_cpu_temp() or 0
        gpu_usage = 0
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_usage = round(gpus[0].load * 100, 2)
                if not temp and hasattr(gpus[0], "temperature"):
                    temp = gpus[0].temperature or temp
        except Exception:
            pass

        # --- Step 4: Store DB entry ---
        benchmark = Benchmark.objects.create(
            user=user,
            type=bench_type,
            cpu_model=cpu_model,
            gpu_model=gpu_model,
            ram_gb=ram_gb,
            cpu_score=cpu_result.get("cpu_score", 0),
            gpu_score=gpu_result.get("gpu_score", 0),
            overall_score=cpu_result.get("cpu_score", 0) + gpu_result.get("gpu_score", 0),
            avg_temp=temp
        )

        BenchmarkMetric.objects.create(
            benchmark=benchmark,
            time=0,
            cpu=cpu_result.get("avg_cpu", 0),
            gpu=gpu_result.get("avg_gpu", gpu_usage),
            temp=temp
        )

        # --- Step 5: Global comparison among same-spec builds ---
        same_specs = Benchmark.objects.filter(
            cpu_model=cpu_model,
            gpu_model=gpu_model,
            ram_gb__gte=ram_gb - 0.5,
            ram_gb__lte=ram_gb + 0.5
        ).exclude(id=benchmark.id)

        top_score = same_specs.order_by('-overall_score').first()
        efficiency_percent = 100
        bottleneck_component = None

        if top_score:
            efficiency_percent = round(
                (benchmark.overall_score / top_score.overall_score) * 100, 2
            )
            # simple bottleneck deduction
            if efficiency_percent < 85:
                bottleneck_component = "CPU" if benchmark.cpu_score < top_score.cpu_score * 0.85 else (
                    "GPU" if benchmark.gpu_score < top_score.gpu_score * 0.85 else "RAM"
                )

        # --- Step 6: Bottleneck analysis ---
        bottleneck_data = analyze_bottlenecks({
            "cpu_threads": psutil.cpu_count(logical=True),
            "total_ram_gb": ram_gb,
            "gpu_info": [{"name": gpu_model}],
            "disk_total_gb": psutil.disk_usage('/').total / (1024 ** 3),
        })

        serializer = BenchmarkSerializer(benchmark)
        data = serializer.data
        data.update({
            "efficiencyPercent": efficiency_percent,
            "topScore": top_score.overall_score if top_score else benchmark.overall_score,
            "bottleneckComponent": bottleneck_component,
            "bottleneckAnalysis": bottleneck_data,
        })

        return Response(data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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

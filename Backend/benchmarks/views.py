# benchmarks/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Max, F
from django.core.paginator import Paginator

from .models import Benchmark, BenchmarkMetric
from .serializers import BenchmarkSerializer, UserSpecsSerializer
from .utils import run_cpu_stress_test, run_gpu_stress_test, get_cpu_temp, run_samples
import GPUtil, psutil, time, math
from diagnostics.utils.system_collector import get_system_info as system_collector
from diagnostics.utils.bottleneck_analyzer import analyze_bottlenecks
from users.models import UserSpecs

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_benchmark(request):
    """
    Safely run benchmark: collect system info, stress CPU/GPU, store results,
    and provide bottleneck/comparison data without throwing 500 errors.
    """
    user = request.user
    bench_type = request.data.get("type", "cpu").lower()

    try:
        # --- Step 1: Collect system snapshot safely ---
        sysinfo = system_collector() or {}
        cpu_model = sysinfo.get("cpu", {}).get("model", "Unknown CPU")
        gpu_model = sysinfo.get("gpu", {}).get("model", "Unknown GPU")

        ram_total_repr = sysinfo.get("ram", {}).get("total", "0")
        try:
            ram_gb = float(str(ram_total_repr).split()[0])
        except Exception:
            ram_gb = 0.0

        # --- Step 2: Run CPU/GPU stress safely ---
        try:
            cpu_result = run_cpu_stress_test(duration_seconds=int(request.data.get("cpu_duration", 10)))
        except Exception:
            cpu_result = {"cpu_score": 0.0, "avg_cpu": 0.0, "duration": 0.0}

        gpu_result = {}
        if bench_type in ["gpu", "hybrid"]:
            try:
                gpu_result = run_gpu_stress_test(duration_seconds=int(request.data.get("gpu_duration", 10)))
            except Exception:
                gpu_result = {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": 0.0}

        # --- Step 3: Safe temperature reading ---
        temp = get_cpu_temp() or 0.0
        gpu_usage = 0.0
        try:
            if GPUtil:
                gpus = GPUtil.getGPUs()
                if gpus:
                    gpu_usage = round(gpus[0].load * 100, 2)
                    if not temp and hasattr(gpus[0], "temperature"):
                        temp = gpus[0].temperature or temp
        except Exception:
            pass

        # --- Step 4: Compute scores ---
        cpu_score = float(cpu_result.get("cpu_score", 0.0) or 0.0)
        gpu_score = float(gpu_result.get("gpu_score", 0.0) or 0.0)
        overall_score = cpu_score + gpu_score

        # --- Step 5: Create or update benchmark safely ---
        benchmark, created = Benchmark.objects.update_or_create(
            user=user,
            cpu_model=cpu_model,
            gpu_model=gpu_model,
            ram_gb=ram_gb,
            defaults={
                "type": bench_type,
                "cpu_score": cpu_score,
                "gpu_score": gpu_score,
                "overall_score": overall_score,
                "avg_temp": float(temp)
            }
        )

        # --- Step 6: Store a safe metric sample ---
        try:
            BenchmarkMetric.objects.create(
                benchmark=benchmark,
                time=0,
                cpu=float(cpu_result.get("avg_cpu", psutil.cpu_percent(interval=0.5) or 0.0)),
                gpu=float(gpu_result.get("avg_gpu", gpu_usage) or 0.0),
                temp=float(temp or 0.0)
            )
        except Exception:
            pass

        # --- Step 7: Update user's specs ---
        try:
            from users.models import UserSpecs
            import psutil
            UserSpecs.objects.update_or_create(
                user=user,
                defaults={
                    "cpu_model": cpu_model,
                    "gpu_model": gpu_model,
                    "ram_gb": ram_gb,
                    "storage_gb": psutil.disk_usage('/').total / (1024 ** 3)
                }
            )
        except Exception:
            pass

        # --- Step 8: Bottleneck analysis ---
        try:
            bottleneck_data = analyze_bottlenecks({
                "cpu_threads": psutil.cpu_count(logical=True) or 1,
                "total_ram_gb": ram_gb,
                "gpu_info": [{"name": gpu_model}],
                "disk_total_gb": psutil.disk_usage('/').total / (1024 ** 3)
            })
        except Exception:
            bottleneck_data = {}

        # --- Step 9: Build response ---
        from .serializers import BenchmarkSerializer
        serializer = BenchmarkSerializer(benchmark)
        data = serializer.data
        data.update({
            "raw_cpu_result": cpu_result,
            "raw_gpu_result": gpu_result,
            "bottleneckAnalysis": bottleneck_data,
            "topScore": benchmark.overall_score,
            "efficiencyPercent": 100.0,
            "bottleneckComponent": None
        })

        return Response(data, status=201)

    except Exception as e:
        import traceback
        print(traceback.format_exc())  # For dev debugging
        return Response({"error": str(e)}, status=500)



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
    """List all user benchmarks (latest first)."""
    user = request.user
    benchmarks = Benchmark.objects.filter(user=user).order_by('-timestamp')
    serializer = BenchmarkSerializer(benchmarks, many=True)
    return Response(serializer.data)


# -------------------------
# New endpoints
# -------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def compare_benchmarks(request):
    """
    Compare this user's latest benchmark with other users that have the same CPU/GPU.
    Query params:
      - cpu_model (optional)
      - gpu_model (optional)
      - ram_gb (optional)
      - page (optional)
    If params omitted, uses user's latest benchmark snapshot.
    """
    user = request.user
    cpu_model = request.query_params.get('cpu_model')
    gpu_model = request.query_params.get('gpu_model')
    ram_gb_q = request.query_params.get('ram_gb')

    # If not provided, try to derive from user's latest benchmark
    if not cpu_model or not gpu_model:
        latest = Benchmark.objects.filter(user=user).order_by('-timestamp').first()
        if latest:
            cpu_model = cpu_model or latest.cpu_model
            gpu_model = gpu_model or latest.gpu_model
            ram_gb_q = ram_gb_q or str(latest.ram_gb)

    if not cpu_model or not gpu_model:
        return Response({"error": "cpu_model and gpu_model required (or run a benchmark first)."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        try:
            ram_gb = float(ram_gb_q) if ram_gb_q is not None else None
        except Exception:
            ram_gb = None

        qs = Benchmark.objects.filter(cpu_model=cpu_model, gpu_model=gpu_model)
        if ram_gb is not None:
            qs = qs.filter(ram_gb__gte=ram_gb - 0.5, ram_gb__lte=ram_gb + 0.5)

        # order by overall_score desc
        qs = qs.order_by('-overall_score')
        # take top 5 for quick comparison
        top5 = qs[:5]

        top_serialized = BenchmarkSerializer(top5, many=True).data

        # find user's rank in this group (1-based)
        all_scores = list(qs.values_list('overall_score', flat=True))
        user_latest = Benchmark.objects.filter(user=user, cpu_model=cpu_model, gpu_model=gpu_model).order_by('-overall_score').first()
        user_rank = None
        user_score = None
        if user_latest:
            user_score = user_latest.overall_score
            # compute rank
            higher = sum(1 for s in all_scores if s > user_score)
            user_rank = higher + 1

        resp = {
            "cpu_model": cpu_model,
            "gpu_model": gpu_model,
            "ram_gb": ram_gb,
            "top5": top_serialized,
            "user_rank": user_rank,
            "user_score": user_score,
            "count": qs.count()
        }
        return Response(resp, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bottleneck_analysis(request):
    """
    Return detailed bottleneck analysis for a given benchmark id or user's latest benchmark.
    Query params:
      - benchmark_id (optional)
    """
    user = request.user
    benchmark_id = request.query_params.get('benchmark_id')

    try:
        if benchmark_id:
            benchmark = Benchmark.objects.filter(id=int(benchmark_id)).first()
        else:
            benchmark = Benchmark.objects.filter(user=user).order_by('-timestamp').first()

        if not benchmark:
            return Response({"error": "Benchmark not found"}, status=status.HTTP_404_NOT_FOUND)

        # Compare benchmark against best-of-same-specs
        same_specs = Benchmark.objects.filter(
            cpu_model=benchmark.cpu_model,
            gpu_model=benchmark.gpu_model,
            ram_gb__gte=benchmark.ram_gb - 0.5,
            ram_gb__lte=benchmark.ram_gb + 0.5
        ).exclude(id=benchmark.id)

        top_score = same_specs.order_by('-overall_score').first()
        efficiency_percent = 100.0
        component = None
        suggestions = []

        if top_score and top_score.overall_score > 0:
            efficiency_percent = round((benchmark.overall_score / top_score.overall_score) * 100.0, 2)
            if efficiency_percent < 90:
                if (top_score.cpu_score or 0) > 0 and benchmark.cpu_score < top_score.cpu_score * 0.9:
                    component = "CPU"
                    suggestions.append("CPU performing below peers — consider higher clocks or more cores.")
                if (top_score.gpu_score or 0) > 0 and benchmark.gpu_score < top_score.gpu_score * 0.9:
                    component = (component or "GPU")
                    suggestions.append("GPU performing below peers — check drivers, thermal/throttling or upgrade.")
                if not suggestions:
                    component = "RAM/IO"
                    suggestions.append("Investigate RAM usage or storage IO; compare configurations with top performers.")

        # hardware spec analysis (generic)
        hw_analysis = analyze_bottlenecks({
            "cpu_threads": psutil.cpu_count(logical=True),
            "total_ram_gb": benchmark.ram_gb,
            "gpu_info": [{"name": benchmark.gpu_model}],
            "disk_total_gb": psutil.disk_usage('/').total / (1024 ** 3),
        })

        resp = {
            "benchmark_id": benchmark.id,
            "cpu_model": benchmark.cpu_model,
            "gpu_model": benchmark.gpu_model,
            "ram_gb": benchmark.ram_gb,
            "cpu_score": benchmark.cpu_score,
            "gpu_score": benchmark.gpu_score,
            "overall_score": benchmark.overall_score,
            "avg_temp": benchmark.avg_temp,
            "efficiency_percent_vs_top": efficiency_percent,
            "likely_bottleneck_component": component,
            "suggestions": suggestions,
            "hardware_analysis": hw_analysis
        }
        return Response(resp, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_user_specs(request):
    """
    Save or update user's hardware specs (UserSpecs). Accepts optional cpu_model, gpu_model, ram_gb, storage_gb.
    """
    user = request.user
    cpu_model = request.data.get('cpu_model')
    gpu_model = request.data.get('gpu_model')
    ram_gb = request.data.get('ram_gb')
    storage_gb = request.data.get('storage_gb')

    try:
        # fallback to collector if fields missing
        if not (cpu_model and gpu_model and ram_gb):
            sysinfo = system_collector()
            cpu_model = cpu_model or sysinfo.get("cpu", {}).get("model", "Unknown CPU")
            gpu_model = gpu_model or sysinfo.get("gpu", {}).get("model", "Unknown GPU")
            ram_total_repr = sysinfo.get("ram", {}).get("total", "0")
            try:
                ram_gb = float(str(ram_total_repr).split()[0])
            except Exception:
                ram_gb = float(ram_gb or 0)

            storage_gb = storage_gb or (psutil.disk_usage('/').total / (1024 ** 3))

        # create or update
        specs, created = UserSpecs.objects.update_or_create(
            user=user,
            defaults={
                'cpu_model': cpu_model,
                'gpu_model': gpu_model,
                'ram_gb': float(ram_gb),
                'storage_gb': float(storage_gb or 0)
            }
        )
        serializer = UserSpecsSerializer(specs)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

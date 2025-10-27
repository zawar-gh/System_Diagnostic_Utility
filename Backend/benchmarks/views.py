from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from users.models import UserSpecs
from statistics import mean
import GPUtil, psutil, time, os, tempfile, numpy as np, traceback

from .models import Benchmark, BenchmarkMetric
from .serializers import BenchmarkSerializer, UserSpecsSerializer
from diagnostics.utils.system_collector import get_system_info as system_collector
from diagnostics.utils.bottleneck_analyzer import analyze_bottlenecks

# -----------------------------------------------
# 🔹 Helper: Disk and RAM Performance Benchmarks
# -----------------------------------------------

def measure_disk_speed():
    """Simple sequential disk read/write speed test using tempfile."""
    try:
        tmp_file = os.path.join(tempfile.gettempdir(), "sdu_disk_test.tmp")
        data = b"x" * (20 * 1024 * 1024)  # 20 MB buffer

        # Write speed
        start = time.time()
        with open(tmp_file, "wb") as f:
            f.write(data)
        write_speed = 20 / (time.time() - start)  # MB/s

        # Read speed
        start = time.time()
        with open(tmp_file, "rb") as f:
            _ = f.read()
        read_speed = 20 / (time.time() - start)  # MB/s

        os.remove(tmp_file)

        avg_speed = (read_speed + write_speed) / 2
        health_percent = min(100, max(30, (avg_speed / 400) * 100))  # 400 MB/s baseline

        return {
            "read_speed": round(read_speed, 2),
            "write_speed": round(write_speed, 2),
            "health_percent": round(health_percent, 1),
        }
    except Exception:
        return {"read_speed": 0.0, "write_speed": 0.0, "health_percent": 0.0}


def measure_ram_speed():
    """Estimate RAM copy bandwidth in GB/s."""
    try:
        a = np.random.rand(20_000_000)  # ~160 MB
        start = time.time()
        b = a.copy()
        duration = time.time() - start
        speed_gbps = (a.nbytes / duration) / (1024 ** 3)
        return {"ram_speed_gbps": round(speed_gbps, 2)}
    except Exception:
        return {"ram_speed_gbps": 0.0}


# -----------------------------------------------
# 🔹 Run Full Benchmark
# -----------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def run_benchmark(request):
    """
    Run CPU/GPU/hybrid benchmarks, measure RAM & Disk,
    and return full system health + bottleneck analysis.
    """
    from .utils import (
        run_cpu_stress_test,
        run_gpu_stress_test,
        run_hybrid_stress_test,
        get_cpu_temp,
    )

    user = request.user
    bench_type = request.data.get("type", "cpu").lower()

    try:
        # 1️⃣ System Snapshot
        sysinfo = system_collector() or {}
        cpu_model = sysinfo.get("cpu", {}).get("model", "Unknown CPU")
        gpu_model = sysinfo.get("gpu", {}).get("model", "Unknown GPU")
        ram_total_repr = sysinfo.get("ram", {}).get("total", "0")
        try:
            ram_gb = float(str(ram_total_repr).split()[0])
        except Exception:
            ram_gb = 0.0

        # 2️⃣ Stress Tests
        cpu_result = {"cpu_score": 0.0, "avg_cpu": 0.0}
        gpu_result = {"gpu_score": 0.0, "avg_gpu": 0.0}

        if bench_type == "cpu":
            cpu_result = run_cpu_stress_test(duration_seconds=10)
        elif bench_type == "gpu":
            gpu_result = run_gpu_stress_test(duration_seconds=10)
        elif bench_type == "hybrid":
            hybrid = run_hybrid_stress_test(duration_seconds=15)
            cpu_result.update(hybrid)
            gpu_result.update(hybrid)

        # 3️⃣ RAM + Disk
        ram_result = measure_ram_speed()
        disk_result = measure_disk_speed()

        # 4️⃣ Temps + GPU Usage
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

        # 5️⃣ Scores
        cpu_score = float(cpu_result.get("cpu_score", 0.0))
        gpu_score = float(gpu_result.get("gpu_score", 0.0))
        ram_score = round(ram_result["ram_speed_gbps"] * 50, 2)
        disk_score = round(((disk_result["read_speed"] + disk_result["write_speed"]) / 2) * 0.2, 2)
        overall_score = round(cpu_score + gpu_score + ram_score + disk_score, 2)

        # 6️⃣ Save Benchmark
        benchmark, _ = Benchmark.objects.update_or_create(
            user=user,
            cpu_model=cpu_model,
            gpu_model=gpu_model,
            defaults={
                "type": bench_type,
                "cpu_score": cpu_score,
                "gpu_score": gpu_score,
                "overall_score": overall_score,
                "avg_temp": temp,
                "ram_gb": ram_gb,
                "ram_speed_gbps": ram_result["ram_speed_gbps"],
                "disk_read_speed": disk_result["read_speed"],
                "disk_write_speed": disk_result["write_speed"],
                "disk_health_percent": disk_result["health_percent"],
            },
        )

        BenchmarkMetric.objects.create(
            benchmark=benchmark,
            time=0,
            cpu=float(cpu_result.get("avg_cpu", 0.0)),
            gpu=float(cpu_result.get("avg_gpu", gpu_usage)),
            temp=float(temp),
        )

        # 7️⃣ Update User Specs
        UserSpecs.objects.update_or_create(
            user=user,
            defaults={
                "cpu_model": cpu_model,
                "gpu_model": gpu_model,
                "ram_gb": ram_gb,
                "storage_gb": psutil.disk_usage("/").total / (1024 ** 3),
            },
        )

        # 8️⃣ Bottleneck Analysis
        bottleneck_data = analyze_bottlenecks({
            "cpu_score": cpu_score,
            "gpu_score": gpu_score,
            "ram_speed_gbps": ram_result["ram_speed_gbps"],
            "disk_read_speed": disk_result["read_speed"],
            "disk_write_speed": disk_result["write_speed"],
            "disk_health_percent": disk_result["health_percent"],
            "total_ram_gb": ram_gb,
            "cpu_threads": psutil.cpu_count(logical=True),
            "gpu_vram_gb": sysinfo.get("gpu", {}).get("vram", 0),
            "avg_temp": temp,
        })

        data = BenchmarkSerializer(benchmark).data
        data.update({
            "ram_result": ram_result,
            "disk_result": disk_result,
            "bottleneckAnalysis": bottleneck_data,
        })
        return Response(data, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------
# 🔹 Compare Two Benchmarks by Specs
# -----------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def compare_benchmarks(request):
    """
    Compare user’s hardware scores vs average system scores.
    """
    from statistics import mean, StatisticsError

    cpu_model = request.query_params.get("cpu_model")
    gpu_model = request.query_params.get("gpu_model")
    ram_gb = float(request.query_params.get("ram_gb", 0))

    try:
        all_benchmarks = Benchmark.objects.all()

        # ✅ Safely compute averages — avoids StatisticsError when no data
        cpu_scores = [float(b.cpu_score) for b in all_benchmarks if b.cpu_score and b.cpu_score > 0]
        gpu_scores = [float(b.gpu_score) for b in all_benchmarks if b.gpu_score and b.gpu_score > 0]

        cpu_avg = round(mean(cpu_scores), 2) if cpu_scores else 0
        gpu_avg = round(mean(gpu_scores), 2) if gpu_scores else 0

        # ✅ Fetch latest benchmark matching user's system
        user_benchmark = Benchmark.objects.filter(
            cpu_model=cpu_model, gpu_model=gpu_model
        ).last()

        if not user_benchmark:
            return Response(
                {"message": "No matching benchmark found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "user_system": {
                "cpu": cpu_model,
                "gpu": gpu_model,
                "ram": ram_gb,
                "scores": {
                    "cpu": user_benchmark.cpu_score,
                    "gpu": user_benchmark.gpu_score,
                    "overall": user_benchmark.overall_score,
                },
            },
            "average_scores": {
                "cpu": cpu_avg,
                "gpu": gpu_avg,
            },
        })

    except StatisticsError:
        return Response(
            {"error": "Not enough data for comparison."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# -----------------------------------------------
# 🔹 Bottleneck Analysis (Direct Endpoint)
# -----------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bottleneck_analysis(request):
    """
    Returns a detailed bottleneck analysis for a given benchmark.
    """
    benchmark_id = request.query_params.get("benchmark_id")
    try:
        benchmark = Benchmark.objects.get(id=benchmark_id)
        bottleneck_data = analyze_bottlenecks({
            "cpu_score": benchmark.cpu_score,
            "gpu_score": benchmark.gpu_score,
            "ram_speed_gbps": getattr(benchmark, "ram_speed_gbps", 0),
            "disk_read_speed": getattr(benchmark, "disk_read_speed", 0),
            "disk_write_speed": getattr(benchmark, "disk_write_speed", 0),
            "total_ram_gb": benchmark.ram_gb,
            "avg_temp": benchmark.avg_temp,
        })
        return Response(bottleneck_data)
    except Benchmark.DoesNotExist:
        return Response({"error": "Benchmark not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------
# 🔹 Live System Metrics
# -----------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def live_metrics(request):
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
        ram_usage = psutil.virtual_memory().percent
        temp = 0.0
        gpu_load = 0.0
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]
                gpu_load = round(gpu.load * 100, 2)
                temp = getattr(gpu, "temperature", 0.0)
        except Exception:
            pass

        return Response({
            "timestamp": time.time(),
            "cpu": cpu_percent,
            "gpu": gpu_load,
            "ram": ram_usage,
            "temp": temp,
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------
# 🔹 Fetch All Benchmarks of Authenticated User
# -----------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_benchmarks(request):
    try:
        benchmarks = Benchmark.objects.filter(user=request.user).order_by("-timestamp")
        serializer = BenchmarkSerializer(benchmarks, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

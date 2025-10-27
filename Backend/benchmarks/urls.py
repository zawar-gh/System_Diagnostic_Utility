#benchmarks/urls.py
from django.urls import path
from .views import (
    run_benchmark,
    live_metrics,
    user_benchmarks,
    compare_benchmarks,
    bottleneck_analysis,
)

urlpatterns = [
    # 🧩 Core Endpoints
    path("", user_benchmarks, name="user_benchmarks"),

    # 🚀 Run benchmarks
    path("run/", run_benchmark, name="run_benchmark"),

    # 📈 Live system monitoring (real-time metrics)
    path("live/", live_metrics, name="live_metrics"),

    # ⚖️ Benchmark comparison between users
    path("compare/", compare_benchmarks, name="compare_benchmarks"),

    # 🔍 Advanced bottleneck analysis & recommendations
    path("bottleneck/", bottleneck_analysis, name="bottleneck_analysis"),
]

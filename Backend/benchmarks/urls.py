from django.urls import path
from .views import (
    user_benchmarks,
    run_benchmark,
    live_metrics,
    compare_benchmarks,
    bottleneck_analysis,
)

urlpatterns = [
    path("", user_benchmarks, name="user_benchmarks"),
    path("run/", run_benchmark, name="run_benchmark"),
    path("live/", live_metrics, name="live_metrics"),
    path("compare/", compare_benchmarks, name="compare_benchmarks"),      # <-- new
    path("bottleneck/", bottleneck_analysis, name="bottleneck_analysis"), # <-- new
]

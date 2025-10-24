#benchmarks/views.py
from django.urls import path
from .views import user_benchmarks, run_benchmark, live_metrics

urlpatterns = [
    path("", user_benchmarks, name="user_benchmarks"),
    path("run/", run_benchmark, name="run_benchmark"),
    path("live/", live_metrics, name="live_metrics"), 
]

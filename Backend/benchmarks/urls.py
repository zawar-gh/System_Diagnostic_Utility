#benchmarks/urls.py
from django.urls import path
from .views import user_benchmarks
from .views import user_benchmarks, run_benchmark


urlpatterns = [
    path('', user_benchmarks, name='user_benchmarks'),
    path('run/', run_benchmark, name='run_benchmark'),  # ✅ new
]

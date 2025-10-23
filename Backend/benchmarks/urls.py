#benchmarks/urls.py
from django.urls import path
from .views import user_benchmarks

urlpatterns = [
    path('', user_benchmarks, name='user_benchmarks'),
]

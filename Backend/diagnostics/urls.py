#diagnostics/urls.py
from django.urls import path
from . import views
from .views import collect_system_info, live_usage

urlpatterns = [
    path('collect/', views.collect_system_info, name='collect_system_info'),
    path("collect/", collect_system_info),
    path("live/", live_usage),
]

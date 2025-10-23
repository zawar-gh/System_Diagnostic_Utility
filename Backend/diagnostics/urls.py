#diagnostics/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('collect/', views.collect_system_info, name='collect_system_info'),
]

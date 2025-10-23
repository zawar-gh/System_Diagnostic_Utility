#sdu/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/diagnostics/', include('diagnostics.urls')),
    path('api/users/', include('users.urls')),
    path('api/benchmarks/', include('benchmarks.urls')), 
]   

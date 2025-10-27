#sdu/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/diagnostics/', include('diagnostics.urls')),
    path('api/users/', include('users.urls')),
    path('api/benchmarks/', include('benchmarks.urls')), 
]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


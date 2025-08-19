from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('station_auth.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/', include('vehicles.urls')),
    path('api/rides/', include('rides.urls')),
    path('api/charging-ports/', include('charging_ports.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reports/', include('reports.urls')),
    path('', include('settings.urls')),
]

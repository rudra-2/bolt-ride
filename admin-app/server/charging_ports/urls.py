from django.urls import path
from . import views

urlpatterns = [
    path('<str:station_id>/', views.get_ports_by_station, name='get_ports_by_station'),
    path('<str:station_id>/assign/', views.assign_vehicle_to_port, name='assign_vehicle_to_port'),
    path('<str:station_id>/remove/', views.remove_vehicle_from_port, name='remove_vehicle_from_port'),
    path('<str:station_id>/available-vehicles/', views.get_available_vehicles, name='get_available_vehicles'),
    path('<str:station_id>/charging-status/', views.get_charging_status, name='get_charging_status'),
    path('<str:station_id>/stop-charging/', views.stop_charging, name='stop_charging'),
]

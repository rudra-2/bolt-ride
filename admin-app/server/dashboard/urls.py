from django.urls import path
from . import views

urlpatterns = [
    path('stats/<str:station_id>/', views.get_dashboard_stats, name="get_dashboard_stats"),
    path('active_rides/<str:station_id>/', views.fetch_active_rides, name="fetch_active_rides"),
    path('vehicles/<str:station_id>/', views.fetch_vehicles_lite, name="fetch_vehicles_lite"),
    path('station/<str:station_id>/', views.get_station_details, name="get_station_details"),

]

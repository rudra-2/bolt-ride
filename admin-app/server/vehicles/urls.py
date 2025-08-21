from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test_connection, name='test_connection'),
    path('station-login/', views.station_login, name='station_login'),
    path("vehicles/<str:station_id>/", views.fetch_vehicles, name="fetch_vehicles"),
    path("vehicles/add/", views.add_vehicle, name="add_vehicle"),
    path("vehicles/update/<str:vehicle_id>/", views.update_vehicle, name="update_vehicle"),
    path("vehicles/update-status/<str:vehicle_id>/", views.update_vehicle_status, name="update_vehicle_status"),
    path("vehicles/delete/<str:vehicle_id>/", views.delete_vehicle, name="delete_vehicle"),
    path("vehicles/details/<str:vehicle_id>/", views.get_vehicle_details, name="get_vehicle_details"),
    path("nearby-stations/<str:station_id>/", views.get_nearby_stations, name="get_nearby_stations"),
    path("vehicles/transfer/", views.transfer_vehicle, name="transfer_vehicle"),
]

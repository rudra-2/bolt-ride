from django.urls import path
from . import views

urlpatterns = [
    path('<str:station_id>/', views.get_rides_by_station, name='get_rides_by_station'),
]
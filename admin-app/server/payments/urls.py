from django.urls import path
from . import views

urlpatterns = [
    path('<str:station_id>/', views.get_payments_by_station, name='get_payments_by_station'),
    path('', views.get_all_payments, name='get_all_payments'),
]

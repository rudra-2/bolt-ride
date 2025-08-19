from django.urls import path
from . import views

urlpatterns = [
    path('<str:station_id>/', views.get_reports, name='get_reports'),
]

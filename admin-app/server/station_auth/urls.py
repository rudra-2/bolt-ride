from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.manager_login, name='manager_login'),
    path('profile/<str:manager_id>/', views.get_manager_profile, name='get_manager_profile'),
    path('profile/<str:manager_id>/update/', views.update_manager_profile, name='update_manager_profile'),
    path('station/<str:station_id>/managers/', views.get_managers_by_station, name='get_managers_by_station'),
    path('verify-access/', views.verify_manager_access, name='verify_manager_access'),
]

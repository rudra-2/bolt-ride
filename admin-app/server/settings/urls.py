from django.urls import path
from . import views

urlpatterns = [
    path('api/settings/<str:station_id>/', views.get_settings, name='get_settings'),
    path('api/settings/update/<str:station_id>/', views.update_settings, name='update_settings'),
    path('api/settings/reset/<str:station_id>/', views.reset_settings, name='reset_settings'),
]

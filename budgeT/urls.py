from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.dashboard_combined_view),
    path('create_link_token/', views.create_link_token),
    path('exchange_public_token/', views.exchange_public_token),
]

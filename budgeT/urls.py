from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView  # Add this import
from .views import PlaidAccountViewSet, TransactionViewSet, register_user, create_link_token, exchange_public_token, sync_transactions  # Add import
from . import views

# Create router for viewsets
router = DefaultRouter()
router.register(r'accounts', PlaidAccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')

# Define URL patterns
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(),
         name='token_verify'),  # Add this new path
    path('api/register/', register_user, name='register_user'),  # Add this line
    path('api/create-link-token/', create_link_token, name='create_link_token'),
    path('api/exchange-token/', exchange_public_token,
         name='exchange_public_token'),
    path('api/sync-transactions/', sync_transactions,
         name='sync_transactions'),  # Add this line
    path('api/', include(router.urls)),
    path('api/payments/', views.payment_list, name='payment-list'),
    path('api/payments/<int:pk>/', views.payment_detail, name='payment-detail'),
    path('api/refresh-account-balances/', views.refresh_account_balances,
         name='refresh-account-balances'),
]

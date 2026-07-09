from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxRateViewSet, CompanyProfileViewSet

router = DefaultRouter()
router.register('taxes', TaxRateViewSet, basename='tax-rate')
router.register('company', CompanyProfileViewSet, basename='company-profile')

urlpatterns = [
    path('', include(router.urls)),
]

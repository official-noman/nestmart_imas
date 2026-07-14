from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CompanyProfileViewSet, TaxRateViewSet

router = DefaultRouter()
router.register('taxes', TaxRateViewSet, basename='tax-rate')
router.register('company', CompanyProfileViewSet, basename='company-profile')

urlpatterns = [
    path('', include(router.urls)),
]

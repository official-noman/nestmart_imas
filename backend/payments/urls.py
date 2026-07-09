from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CreditNoteViewSet, PaymentViewSet


router = DefaultRouter()
router.register('payments', PaymentViewSet, basename='payment')
router.register('credit-notes', CreditNoteViewSet, basename='credit-note')

urlpatterns = [
    path('', include(router.urls)),
]

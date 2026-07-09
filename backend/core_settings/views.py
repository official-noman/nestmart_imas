from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import TaxRate, CompanyProfile
from .serializers import TaxRateSerializer, CompanyProfileSerializer

class IsAdminOrReadOnly(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return bool(request.user and request.user.is_staff)

class TaxRateViewSet(viewsets.ModelViewSet):
    queryset = TaxRate.objects.all()
    serializer_class = TaxRateSerializer
    permission_classes = [IsAdminOrReadOnly]

class CompanyProfileViewSet(viewsets.ModelViewSet):
    queryset = CompanyProfile.objects.all()
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

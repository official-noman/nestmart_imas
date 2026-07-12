from rest_framework import viewsets
from users.permissions import IsAdminOrReadOnly
from .models import TaxRate, CompanyProfile
from .serializers import TaxRateSerializer, CompanyProfileSerializer

class TaxRateViewSet(viewsets.ModelViewSet):
    queryset = TaxRate.objects.all()
    serializer_class = TaxRateSerializer
    permission_classes = [IsAdminOrReadOnly]

class CompanyProfileViewSet(viewsets.ModelViewSet):
    queryset = CompanyProfile.objects.all()
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

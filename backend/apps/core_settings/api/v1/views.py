from rest_framework import viewsets

from apps.common.permissions import IsAdminOrReadOnly

from ...selectors import get_company_profiles, get_tax_rates
from .serializers import CompanyProfileSerializer, TaxRateSerializer


class TaxRateViewSet(viewsets.ModelViewSet):
    queryset = get_tax_rates()
    serializer_class = TaxRateSerializer
    permission_classes = [IsAdminOrReadOnly]

class CompanyProfileViewSet(viewsets.ModelViewSet):
    queryset = get_company_profiles()
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

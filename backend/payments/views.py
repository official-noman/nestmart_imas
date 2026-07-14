from rest_framework import viewsets

from apps.common.permissions import IsAccountant

from .models import CreditNote, Payment
from .serializers import CreditNoteSerializer, PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.prefetch_related('allocations').select_related('customer')
    serializer_class = PaymentSerializer
    permission_classes = [IsAccountant]


class CreditNoteViewSet(viewsets.ModelViewSet):
    queryset = CreditNote.objects.select_related('customer', 'invoice')
    serializer_class = CreditNoteSerializer
    permission_classes = [IsAccountant]

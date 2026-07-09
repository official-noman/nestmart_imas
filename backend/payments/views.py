from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import CreditNote, Payment
from .serializers import CreditNoteSerializer, PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.prefetch_related('allocations').select_related('customer')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class CreditNoteViewSet(viewsets.ModelViewSet):
    queryset = CreditNote.objects.select_related('customer', 'invoice')
    serializer_class = CreditNoteSerializer
    permission_classes = [IsAuthenticated]

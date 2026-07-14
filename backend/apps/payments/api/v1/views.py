from rest_framework import viewsets

from apps.common.permissions import IsAccountant

from ...selectors import get_credit_notes, get_payments
from .serializers import CreditNoteSerializer, PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = get_payments()
    serializer_class = PaymentSerializer
    permission_classes = [IsAccountant]


class CreditNoteViewSet(viewsets.ModelViewSet):
    queryset = get_credit_notes()
    serializer_class = CreditNoteSerializer
    permission_classes = [IsAccountant]

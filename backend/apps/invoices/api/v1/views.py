from rest_framework import viewsets

from apps.common.permissions import IsAccountant

from ...models import Invoice
from ...selectors import get_invoices
from .serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = get_invoices()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAccountant]

    def get_queryset(self):
        Invoice.mark_overdue_invoices()
        return super().get_queryset()

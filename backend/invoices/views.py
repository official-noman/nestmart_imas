from rest_framework import viewsets

from users.permissions import IsAccountant

from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.prefetch_related('lines').select_related('customer')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAccountant]

    def get_queryset(self):
        Invoice.mark_overdue_invoices()
        return super().get_queryset()

from .models import Invoice


def get_invoices():
    return Invoice.objects.prefetch_related('lines').select_related('customer')

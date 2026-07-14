from .models import CreditNote, Payment


def get_payments():
    return Payment.objects.prefetch_related('allocations').select_related('customer')


def get_credit_notes():
    return CreditNote.objects.select_related('customer', 'invoice')

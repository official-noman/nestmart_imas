from .models import Contact


def get_contacts():
    return Contact.with_outstanding_balance()

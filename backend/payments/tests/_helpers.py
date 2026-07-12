from conftest import PaymentFactory


def make_payment(invoice, amount):
    return PaymentFactory(customer=invoice.customer, amount=amount)

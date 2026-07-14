from decimal import Decimal


def line(item, quantity, unit_price, discount='0.00', tax_rate='0.00'):
    return {
        'item': item,
        'quantity': Decimal(quantity),
        'unit_price': Decimal(unit_price),
        'discount': Decimal(discount),
        'tax_rate': Decimal(tax_rate),
    }

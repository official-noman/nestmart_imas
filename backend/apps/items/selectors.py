from .models import Item


def get_items():
    return Item.objects.all()

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ...selectors import get_items
from .serializers import ItemSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = get_items()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

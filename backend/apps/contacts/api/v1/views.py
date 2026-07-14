from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ...selectors import get_contacts
from .serializers import ContactSerializer


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_contacts()

from rest_framework import mixins, viewsets

from apps.common.permissions import IsAccountant

from .models import Account, JournalEntry
from .serializers import AccountSerializer, JournalEntrySerializer


class AccountViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAccountant]


class JournalEntryViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = JournalEntry.objects.prefetch_related('lines__account', 'lines__contact').all()
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAccountant]

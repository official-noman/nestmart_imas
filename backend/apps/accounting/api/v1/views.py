from rest_framework import mixins, viewsets

from apps.common.permissions import IsAccountant

from ...selectors import get_accounts, get_journal_entries
from .serializers import AccountSerializer, JournalEntrySerializer


class AccountViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = get_accounts()
    serializer_class = AccountSerializer
    permission_classes = [IsAccountant]


class JournalEntryViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = get_journal_entries()
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAccountant]

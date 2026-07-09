from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import Account, JournalEntry, JournalLine


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = (
            'id',
            'code',
            'name',
            'account_type',
            'is_active',
        )
        read_only_fields = ('id',)


class JournalLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalLine
        fields = (
            'id',
            'account',
            'contact',
            'entry_type',
            'amount',
        )
        read_only_fields = ('id',)


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True)

    class Meta:
        model = JournalEntry
        fields = (
            'id',
            'entry_number',
            'date',
            'description',
            'source',
            'lines',
            'created_at',
        )
        read_only_fields = ('id', 'entry_number', 'created_at')

    def validate(self, attrs):
        lines = attrs.get('lines', [])
        sum_debits = sum(
            line['amount']
            for line in lines
            if line['entry_type'] == JournalLine.EntryType.DEBIT
        )
        sum_credits = sum(
            line['amount']
            for line in lines
            if line['entry_type'] == JournalLine.EntryType.CREDIT
        )

        if Decimal(sum_debits) != Decimal(sum_credits):
            raise serializers.ValidationError(
                'Balanced double-entry constraint failed: Total Debits must equal Total Credits.'
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        journal_entry = JournalEntry.objects.create(**validated_data)

        for line_data in lines_data:
            JournalLine.objects.create(journal_entry=journal_entry, **line_data)

        return journal_entry

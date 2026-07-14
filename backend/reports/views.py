from decimal import Decimal

from django.db.models import Q, Sum
from django.db.models.functions import Coalesce
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounting.models import JournalLine
from apps.common.permissions import IsAccountant
from apps.invoices.models import Invoice
from payments.models import PaymentAllocation

ZERO = Decimal('0.00')


class DashboardKPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # total_receivables: net AR balance (debits - credits) in one query.
        ar_totals = JournalLine.objects.filter(account__code='1200').aggregate(
            debits=Coalesce(Sum('amount', filter=Q(entry_type=JournalLine.EntryType.DEBIT)), ZERO),
            credits=Coalesce(Sum('amount', filter=Q(entry_type=JournalLine.EntryType.CREDIT)), ZERO),
        )
        total_receivables = ar_totals['debits'] - ar_totals['credits']

        # total_revenue
        total_revenue = Invoice.objects.filter(status=Invoice.Status.PAID).aggregate(
            total=Coalesce(Sum('grand_total'), ZERO)
        )['total']

        # overdue_amount: invoiced total minus allocated payments, both as
        # single aggregates (a join-based Sum would double count grand_total
        # once per allocation row, so this is deliberately two queries).
        overdue_invoiced = Invoice.objects.filter(status=Invoice.Status.OVERDUE).aggregate(
            total=Coalesce(Sum('grand_total'), ZERO)
        )['total']
        overdue_paid = PaymentAllocation.objects.filter(
            invoice__status=Invoice.Status.OVERDUE
        ).aggregate(total=Coalesce(Sum('amount_allocated'), ZERO))['total']
        overdue_amount = overdue_invoiced - overdue_paid

        return Response({
            'total_receivables': total_receivables,
            'total_revenue': total_revenue,
            'overdue_amount': overdue_amount,
        })


class ProfitAndLossView(APIView):
    permission_classes = [IsAccountant]

    def get(self, request):
        # Income accounts increase with CREDIT, decrease with DEBIT.
        income_totals = JournalLine.objects.filter(account__account_type='Income').aggregate(
            credits=Coalesce(Sum('amount', filter=Q(entry_type=JournalLine.EntryType.CREDIT)), ZERO),
            debits=Coalesce(Sum('amount', filter=Q(entry_type=JournalLine.EntryType.DEBIT)), ZERO),
        )
        total_income = income_totals['credits'] - income_totals['debits']

        # Expense accounts increase with DEBIT, decrease with CREDIT.
        expense_totals = JournalLine.objects.filter(account__account_type='Expense').aggregate(
            debits=Coalesce(Sum('amount', filter=Q(entry_type=JournalLine.EntryType.DEBIT)), ZERO),
            credits=Coalesce(Sum('amount', filter=Q(entry_type=JournalLine.EntryType.CREDIT)), ZERO),
        )
        total_expense = expense_totals['debits'] - expense_totals['credits']

        net_profit = total_income - total_expense

        return Response({
            'total_income': total_income,
            'total_expense': total_expense,
            'net_profit': net_profit,
        })

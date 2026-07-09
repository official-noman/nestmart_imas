from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from decimal import Decimal
from django.db.models.functions import Coalesce

from accounting.models import JournalLine
from invoices.models import Invoice

class DashboardKPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # total_receivables
        ar_lines = JournalLine.objects.filter(account__code='1200')
        debits = ar_lines.filter(entry_type=JournalLine.EntryType.DEBIT).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
        credits = ar_lines.filter(entry_type=JournalLine.EntryType.CREDIT).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
        total_receivables = debits - credits

        # total_revenue
        total_revenue = Invoice.objects.filter(status=Invoice.Status.PAID).aggregate(
            total=Coalesce(Sum('grand_total'), Decimal('0.00'))
        )['total']

        # overdue_amount
        overdue_invoices = Invoice.objects.filter(status=Invoice.Status.OVERDUE).annotate(
            total_paid=Coalesce(Sum('allocations__amount_allocated'), Decimal('0.00'))
        )
        overdue_amount = Decimal('0.00')
        for inv in overdue_invoices:
            overdue_amount += (inv.grand_total - inv.total_paid)

        return Response({
            'total_receivables': total_receivables,
            'total_revenue': total_revenue,
            'overdue_amount': overdue_amount,
        })

class ProfitAndLossView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # total_income
        income_lines = JournalLine.objects.filter(account__account_type='Income')
        # Income usually increases with CREDIT and decreases with DEBIT. 
        # But wait, sum of JournalLines for Income accounts. The prompt says "Sum of JournalLines for Income accounts"
        # We can sum CREDITS - DEBITS.
        income_credits = income_lines.filter(entry_type=JournalLine.EntryType.CREDIT).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
        income_debits = income_lines.filter(entry_type=JournalLine.EntryType.DEBIT).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
        total_income = income_credits - income_debits

        # total_expense
        expense_lines = JournalLine.objects.filter(account__account_type='Expense')
        # Expenses increase with DEBIT and decrease with CREDIT
        expense_debits = expense_lines.filter(entry_type=JournalLine.EntryType.DEBIT).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
        expense_credits = expense_lines.filter(entry_type=JournalLine.EntryType.CREDIT).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
        total_expense = expense_debits - expense_credits

        net_profit = total_income - total_expense

        return Response({
            'total_income': total_income,
            'total_expense': total_expense,
            'net_profit': net_profit,
        })

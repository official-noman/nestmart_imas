from django.core.management.base import BaseCommand
from accounting.models import Account

class Command(BaseCommand):
    help = 'Setup default chart of accounts'

    def handle(self, *args, **options):
        accounts = [
            {'code': '1000', 'name': 'Cash/Bank', 'account_type': Account.AccountType.ASSET},
            {'code': '1200', 'name': 'Accounts Receivable', 'account_type': Account.AccountType.ASSET},
            {'code': '4000', 'name': 'Sales Income', 'account_type': Account.AccountType.INCOME},
        ]

        for acc_data in accounts:
            account, created = Account.objects.get_or_create(
                code=acc_data['code'],
                defaults={'name': acc_data['name'], 'account_type': acc_data['account_type']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created account: {account}"))
            else:
                self.stdout.write(f"Account {account} already exists.")

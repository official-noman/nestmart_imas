import { Account } from '../_types';

export const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

export const groupAccountsByType = (accounts: Account[]) =>
  accounts.reduce((acc, account) => {
    if (!acc[account.account_type]) acc[account.account_type] = [];
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  is_active: boolean;
}

export interface AccountForm {
  code: string;
  name: string;
  account_type: string;
}

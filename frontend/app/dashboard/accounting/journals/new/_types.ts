export interface Account {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Contact {
  id: number;
  name: string;
  is_active: boolean;
}

export interface JournalLineInput {
  uid: string;
  account: string;
  contact: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: string;
}

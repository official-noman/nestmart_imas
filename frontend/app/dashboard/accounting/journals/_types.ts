export interface JournalLine {
  id: number;
  account: number;
  contact?: number | null;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: string;
}

export interface JournalEntry {
  id: number;
  entry_number: string;
  date: string;
  description: string;
  source: string;
  lines: JournalLine[];
}

export interface Account {
  id: number;
  code: string;
  name: string;
}

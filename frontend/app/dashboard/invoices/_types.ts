export interface Invoice {
  id: number;
  invoice_number: string;
  customer: number;
  customer_name?: string;
  status: string;
  issue_date: string;
  due_date: string;
  grand_total: string;
}

export interface Contact {
  id: number;
  name: string;
  contact_type: string;
}

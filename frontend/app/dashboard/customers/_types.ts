export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  outstanding_balance: string | number;
  billing_address: string;
}

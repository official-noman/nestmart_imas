export interface CompanyProfile {
  id?: number;
  name: string;
  currency_symbol: string;
  invoice_prefix: string;
  tax_id: string;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: string;
  is_active: boolean;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

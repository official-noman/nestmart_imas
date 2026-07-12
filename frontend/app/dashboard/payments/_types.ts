export interface PaymentAllocation {
  id: number;
  invoice: number;
  amount_allocated: string;
}

export interface Payment {
  id: number;
  customer: number;
  amount: string;
  payment_method: string;
  reference: string;
  payment_date: string;
  allocations: PaymentAllocation[];
  created_at: string;
}

export interface Contact {
  id: number;
  name: string;
  contact_type: string;
  is_active: boolean;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer: number;
  status: string;
  grand_total: string;
  allocations?: { amount_allocated: string }[]; // Assuming we might need this if populated, else we calculate from payments or it's returned by a custom endpoint. Wait, the invoice model has `allocations` related name. So a GET /invoices/ might not return total paid. Let's assume we can fetch it or just show grand_total and allow allocation.
  // Actually, the requirements say "Current Outstanding Balance". We might need to compute this if it's not provided, but let's assume we have `subtotal`, `discount_total`, `tax_total`, `grand_total`. The instructions say: "Invoice Number, Grand Total, and Current Outstanding Balance".
  // Let's check the invoice endpoint. It returns grand_total. Let's assume outstanding is grand_total for now if not provided, or we can calculate it if we have all allocations.
}

// Extend Invoice to include calculated fields if needed locally
export type InvoiceWithBalance = Invoice & { total_paid?: number; outstanding_balance?: number };

export interface ModalForm {
  customer: string;
  amount: string;
  payment_method: string;
  reference: string;
  payment_date: string;
}

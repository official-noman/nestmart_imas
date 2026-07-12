export interface Contact {
  id: number;
  name: string;
  contact_type: string;
  is_active: boolean;
}

export interface Item {
  id: number;
  name: string;
  sku: string;
  unit_price: string;
  tax_rate: string;
}

export interface LineItem {
  uid: string;     // local unique key for React rendering
  item: number | '';
  quantity: number;
  unit_price: string;
  discount: string;
  tax_rate: string;
}

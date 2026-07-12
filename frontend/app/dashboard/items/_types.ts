export interface Item {
  id: number;
  sku: string;
  name: string;
  unit_price: string | number;
  tax_rate: string | number;
  track_stock: boolean;
  stock_quantity: number;
}

export interface ItemForm {
  sku: string;
  name: string;
  unit_price: string | number;
  tax_rate: string | number;
  track_stock: boolean;
  stock_quantity: number;
}

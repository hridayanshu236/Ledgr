export type PaymentMethod = string;

export type Category = string;

export interface LineItem {
  id?: string;
  name: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

export interface TransactionItem {
  id?: string;
  merchant_or_entity: string;
  date: string;
  amount: string;
  payment_method: PaymentMethod;
  category: Category;
  remarks: string | null;
  line_items: LineItem[];
}

export interface TransactionBatch {
  transactions: TransactionItem[];
}

/**
 * Tipos do módulo ERP Financeiro
 */

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'partially_paid' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
export type TransactionType = 'revenue' | 'expense' | 'commission' | 'refund' | 'adjustment';

export interface FinancialRecord {
  id: string;
  transaction_number: string;
  transaction_type: TransactionType;
  category: string;
  subcategory?: string;
  gross_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  status: TransactionStatus;
  description: string;
  notes?: string;
  transaction_date: string;
  due_date?: string;
  completed_at?: string;
  appointment_id?: string;
  client_id?: string;
  barber_id?: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  financial_record_id: string;
  item_type: 'service' | 'product' | 'extra';
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  payment_number: string;
  financial_record_id: string;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transaction_id?: string;
  authorization_code?: string;
  pix_qr_code?: string;
  pix_key?: string;
  payment_date?: string;
  confirmed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CheckoutItem {
  type: 'service' | 'product' | 'extra';
  id: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface CreateTransactionRequest {
  appointment_id?: string;
  client_id: string;
  barber_id?: string;
  items: CheckoutItem[];
  payment_method: PaymentMethod;
  discount_amount?: number;
  notes?: string;
  transaction_date?: string;
  transaction_datetime?: string;
}

export interface TransactionSummary {
  total_revenue: number;
  total_expenses: number;
  total_commissions: number;
  net_profit: number;
  profit_margin: number;
  transaction_count: number;
  pending_amount: number;
}

export interface DashboardMetrics {
  today: TransactionSummary;
  week: TransactionSummary;
  month: TransactionSummary;
  year: TransactionSummary;
}

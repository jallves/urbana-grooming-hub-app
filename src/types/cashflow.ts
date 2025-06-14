
import { Database } from '@/integrations/supabase/types';

export type CashFlow = Database['public']['Tables']['cash_flow']['Row'];
export type NewCashFlow = Omit<CashFlow, 'id' | 'created_at' | 'updated_at'>;
export type CashFlowCategory = Database['public']['Tables']['cash_flow_categories']['Row'];

export interface CashFlowFormData {
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  payment_method?: string;
  reference_id?: string;
  reference_type?: string;
  transaction_date: Date;
  notes?: string;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  period: string;
}

export interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

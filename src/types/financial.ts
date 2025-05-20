
import { Database } from '@/integrations/supabase/types';

// Define o tipo para transações financeiras
export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];

// Define um tipo para novas transações (sem id e timestamps)
export type NewFinancialTransaction = Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de transações
export interface FinancialTransactionFormData {
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string | null;
  category: string | null;
  payment_method: string | null;
  status: 'pending' | 'completed' | 'canceled';
  transaction_date: Date;
  appointment_id?: string | null;
}

// Define um tipo para comissões de barbeiros
export type BarberCommission = Database['public']['Tables']['barber_commissions']['Row'];

// Define um tipo para novas comissões (sem id e timestamps)
export type NewBarberCommission = Omit<BarberCommission, 'id' | 'created_at' | 'updated_at'>;

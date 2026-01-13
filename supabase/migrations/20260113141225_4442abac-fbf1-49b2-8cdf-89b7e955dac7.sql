
-- Additional tables needed

-- 1. Add columns to cash_register_sessions
ALTER TABLE public.cash_register_sessions
ADD COLUMN IF NOT EXISTS total_sales NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_expenses NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_commissions NUMERIC(10,2) DEFAULT 0;

-- 2. Financial transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference_id UUID,
  barber_id UUID REFERENCES public.painel_barbeiros(id),
  client_id UUID REFERENCES public.painel_clientes(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage financial_transactions" ON public.financial_transactions
  USING (public.is_admin_or_higher(auth.uid()));

-- 3. Add notes to cash_flow
ALTER TABLE public.cash_flow
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Add services relation columns to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS services JSONB;

-- 5. Update specialties in staff to be text instead of array for compatibility
-- First we need to convert array to text
CREATE OR REPLACE FUNCTION array_to_comma_string(arr text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(array_to_string(arr, ', '), '');
$$;

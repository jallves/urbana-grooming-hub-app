
-- Additional missing tables and columns

-- 1. Add notes column to financial_records
ALTER TABLE public.financial_records
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add color column to cash_flow_categories
ALTER TABLE public.cash_flow_categories
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6B7280';

-- 3. Add status_totem to painel_agendamentos
ALTER TABLE public.painel_agendamentos
ADD COLUMN IF NOT EXISTS status_totem TEXT;

-- 4. Add discount_amount to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- 5. Add payment_method to cash_flow
ALTER TABLE public.cash_flow
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 6. Add amount column to barber_commissions
ALTER TABLE public.barber_commissions
ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);

-- Update amount from valor if null
UPDATE public.barber_commissions SET amount = valor WHERE amount IS NULL;

-- 7. Add appointment_source to barber_commissions
ALTER TABLE public.barber_commissions
ADD COLUMN IF NOT EXISTS appointment_source TEXT,
ADD COLUMN IF NOT EXISTS appointment_id UUID,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- 8. Cash register sessions table
CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(10,2),
  expected_balance NUMERIC(10,2),
  difference NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  opened_by UUID,
  closed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cash register" ON public.cash_register_sessions
  USING (public.is_admin_or_higher(auth.uid()));

-- 9. Client profiles table (for extended client data)
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.painel_clientes(id) ON DELETE CASCADE,
  preferences JSONB,
  notes TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client profiles" ON public.client_profiles
  USING (public.is_admin_or_higher(auth.uid()));

-- 10. Add status to employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 11. Check barber slot availability function
CREATE OR REPLACE FUNCTION public.check_barber_slot_availability(
  p_barber_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_end TIME;
  v_conflict_count INTEGER;
BEGIN
  v_slot_end := p_time + (p_duration || ' minutes')::INTERVAL;
  
  SELECT COUNT(*) INTO v_conflict_count
  FROM painel_agendamentos
  WHERE barbeiro_id = p_barber_id
    AND data = p_date
    AND status NOT IN ('cancelado', 'no_show')
    AND (
      (hora >= p_time AND hora < v_slot_end)
      OR (hora + INTERVAL '30 minutes' > p_time AND hora < v_slot_end)
    );
  
  RETURN v_conflict_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_barber_slot_availability TO anon, authenticated;

-- 12. Add venda_id to painel_agendamentos
ALTER TABLE public.painel_agendamentos
ADD COLUMN IF NOT EXISTS venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL;

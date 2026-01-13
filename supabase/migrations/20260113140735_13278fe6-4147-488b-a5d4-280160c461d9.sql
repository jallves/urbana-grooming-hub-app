
-- =============================================
-- ADDITIONAL TABLES AND COLUMNS - PART 2
-- =============================================

-- 1. Add missing columns to working_hours
ALTER TABLE public.working_hours
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Add missing columns to painel_clientes
ALTER TABLE public.painel_clientes
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 3. Add missing columns to staff
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS staff_id UUID;

-- 4. Add missing columns to painel_barbeiros
ALTER TABLE public.painel_barbeiros
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'barber',
ADD COLUMN IF NOT EXISTS staff_id UUID,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 50.00;

-- 5. Add missing columns to painel_servicos
ALTER TABLE public.painel_servicos
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Update existing data to populate new columns
UPDATE public.painel_servicos SET 
  name = nome,
  price = preco,
  duration = duracao,
  is_active = ativo
WHERE name IS NULL;

-- 6. Service Staff (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.service_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.painel_servicos(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(service_id, staff_id)
);

ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read service_staff" ON public.service_staff
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service_staff" ON public.service_staff
  USING (public.is_admin_or_higher(auth.uid()));

-- 7. Barber Availability
CREATE TABLE IF NOT EXISTS public.barber_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.barber_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read barber_availability" ON public.barber_availability
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage barber_availability" ON public.barber_availability
  USING (public.is_admin_or_higher(auth.uid()));

-- 8. Get Birthday Clients Function
CREATE OR REPLACE FUNCTION public.get_birthday_clients()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'nome', nome,
      'email', email,
      'telefone', telefone,
      'data_nascimento', data_nascimento,
      'days_until', 
        CASE 
          WHEN EXTRACT(DOY FROM data_nascimento::date) >= EXTRACT(DOY FROM CURRENT_DATE)
          THEN EXTRACT(DOY FROM data_nascimento::date) - EXTRACT(DOY FROM CURRENT_DATE)
          ELSE 365 - EXTRACT(DOY FROM CURRENT_DATE) + EXTRACT(DOY FROM data_nascimento::date)
        END
    )
  ) INTO v_result
  FROM painel_clientes
  WHERE data_nascimento IS NOT NULL;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_birthday_clients TO authenticated;

-- 9. Contas a Pagar (Payable Accounts)
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  categoria TEXT,
  fornecedor TEXT,
  status TEXT DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contas_pagar" ON public.contas_pagar
  USING (public.is_admin_or_higher(auth.uid()));

-- 10. Contas a Receber (Receivable Accounts)
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  categoria TEXT,
  cliente_id UUID REFERENCES public.painel_clientes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contas_receber" ON public.contas_receber
  USING (public.is_admin_or_higher(auth.uid()));

-- 11. Marketing Campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'email', 'whatsapp', 'sms'
  status TEXT DEFAULT 'draft',
  target_audience TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.marketing_campaigns
  USING (public.is_admin_or_higher(auth.uid()));

-- 12. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.settings
  USING (public.is_admin_or_higher(auth.uid()));

-- 13. Appointment Slots (pre-generated time slots)
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read appointment_slots" ON public.appointment_slots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage appointment_slots" ON public.appointment_slots
  USING (public.is_admin_or_higher(auth.uid()));

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_data ON public.painel_agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_status ON public.painel_agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_vendas_created_at ON public.vendas(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_records_created_at ON public.financial_records(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_flow_created_at ON public.cash_flow(created_at);

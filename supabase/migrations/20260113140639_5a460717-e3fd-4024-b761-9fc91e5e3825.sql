
-- =============================================
-- ADDITIONAL TABLES AND FUNCTIONS
-- =============================================

-- 1. Add transaction_date to cash_flow if not exists
ALTER TABLE public.cash_flow 
ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;

-- 2. Discount Coupons Table
CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_amount NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Policies for discount_coupons
CREATE POLICY "Public can read active coupons" ON public.discount_coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.discount_coupons
  USING (public.is_admin_or_higher(auth.uid()));

-- 3. Apply Coupon to Appointment Function
CREATE OR REPLACE FUNCTION public.apply_coupon_to_appointment(
  p_appointment_id UUID,
  p_coupon_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_appointment RECORD;
  v_service_price NUMERIC;
  v_discount_amount NUMERIC;
  v_final_amount NUMERIC;
BEGIN
  -- Get coupon
  SELECT * INTO v_coupon 
  FROM discount_coupons 
  WHERE code = UPPER(p_coupon_code) 
    AND is_active = true
  LIMIT 1;
  
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom não encontrado');
  END IF;
  
  -- Check validity dates
  IF v_coupon.valid_from > CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom ainda não está válido');
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom expirado');
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom esgotado');
  END IF;
  
  -- Get appointment and service price
  SELECT a.*, s.preco INTO v_appointment
  FROM painel_agendamentos a
  LEFT JOIN painel_servicos s ON a.servico_id = s.id
  WHERE a.id = p_appointment_id;
  
  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;
  
  v_service_price := COALESCE(v_appointment.preco, 0);
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := v_service_price * (v_coupon.discount_value / 100);
  ELSE
    v_discount_amount := v_coupon.discount_value;
  END IF;
  
  -- Ensure discount doesn't exceed price
  v_discount_amount := LEAST(v_discount_amount, v_service_price);
  v_final_amount := v_service_price - v_discount_amount;
  
  -- Increment coupon usage
  UPDATE discount_coupons 
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = v_coupon.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'discount_amount', v_discount_amount,
    'final_amount', v_final_amount,
    'original_amount', v_service_price
  );
END;
$$;

-- 4. Add more columns to financial_records if needed
ALTER TABLE public.financial_records
ADD COLUMN IF NOT EXISTS barber_name TEXT,
ADD COLUMN IF NOT EXISTS service_name TEXT,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.painel_clientes(id) ON DELETE SET NULL;

-- 5. Add status column to cash_flow
ALTER TABLE public.cash_flow
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 6. Comissoes Table (legacy support)
CREATE TABLE IF NOT EXISTS public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE CASCADE,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  valor NUMERIC(10,2) NOT NULL,
  tipo TEXT DEFAULT 'servico',
  status TEXT DEFAULT 'pendente',
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage comissoes" ON public.comissoes
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Barbers can view own comissoes" ON public.comissoes
  FOR SELECT USING (
    barbeiro_id IN (
      SELECT pb.id FROM public.painel_barbeiros pb
      JOIN auth.users u ON u.email = pb.email
      WHERE u.id = auth.uid()
    )
  );

-- 7. Employees Table (for compatibility)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'barber',
  commission_rate NUMERIC(5,2) DEFAULT 50.00,
  is_active BOOLEAN DEFAULT true,
  photo_url TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active employees" ON public.employees
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage employees" ON public.employees
  USING (public.is_admin_or_higher(auth.uid()));

-- 8. Push Subscriptions Table (for notifications)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
  USING (auth.uid() = user_id);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.apply_coupon_to_appointment TO anon, authenticated;

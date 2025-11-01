-- Tabela para sessões do totem
CREATE TABLE IF NOT EXISTS public.totem_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.painel_agendamentos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle',
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para serviços extras adicionados durante o atendimento
CREATE TABLE IF NOT EXISTS public.appointment_extra_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.painel_agendamentos(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.painel_servicos(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES public.staff(id)
);

-- Tabela para pagamentos do totem
CREATE TABLE IF NOT EXISTS public.totem_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.totem_sessions(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  pix_qr_code TEXT,
  pix_key TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_totem_sessions_appointment ON public.totem_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_totem_sessions_status ON public.totem_sessions(status);
CREATE INDEX IF NOT EXISTS idx_extra_services_appointment ON public.appointment_extra_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_totem_payments_session ON public.totem_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_totem_payments_status ON public.totem_payments(status);

-- RLS Policies
ALTER TABLE public.totem_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totem_payments ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso público ao totem (será refinada depois)
CREATE POLICY "Allow public access to totem_sessions" ON public.totem_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to extra_services" ON public.appointment_extra_services
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to totem_payments" ON public.totem_payments
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_totem_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_totem_sessions_updated_at
  BEFORE UPDATE ON public.totem_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_totem_updated_at();

CREATE TRIGGER update_totem_payments_updated_at
  BEFORE UPDATE ON public.totem_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_totem_updated_at();
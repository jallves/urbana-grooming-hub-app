
CREATE TABLE public.coffee_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.painel_agendamentos(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.painel_clientes(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coffee_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coffee_records"
ON public.coffee_records FOR ALL
USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Public can insert coffee_records"
ON public.coffee_records FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can read coffee_records"
ON public.coffee_records FOR SELECT
USING (true);

CREATE INDEX idx_coffee_records_created_at ON public.coffee_records(created_at);

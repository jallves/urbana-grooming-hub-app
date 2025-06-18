
-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública dos serviços ativos
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- Política para permitir leitura pública dos barbeiros ativos
CREATE POLICY "Anyone can view active staff" ON public.staff
  FOR SELECT USING (is_active = true);

-- Política para permitir que clientes autenticados criem agendamentos
CREATE POLICY "Authenticated users can create appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Política para permitir que clientes vejam seus próprios agendamentos
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    client_id IN (
      SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'
    )
  );

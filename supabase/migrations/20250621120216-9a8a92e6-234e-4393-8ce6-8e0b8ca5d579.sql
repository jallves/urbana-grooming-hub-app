
-- Primeiro, vamos verificar e criar políticas RLS para permitir acesso público aos serviços
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- Criar política para permitir acesso público aos barbeiros ativos
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;
CREATE POLICY "Anyone can view active staff" ON public.staff
  FOR SELECT USING (is_active = true AND role = 'barber');

-- Verificar se RLS está habilitado nas tabelas
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam seus próprios agendamentos
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    client_id IN (
      SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Política para permitir que clientes autenticados criem agendamentos
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
CREATE POLICY "Authenticated users can create appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);

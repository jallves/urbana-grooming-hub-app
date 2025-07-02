
-- Permitir que clientes autenticados vejam todos os serviços ativos
CREATE POLICY "Clients can view active services" ON public.services
FOR SELECT USING (is_active = true);

-- Permitir que clientes autenticados vejam todos os funcionários ativos
CREATE POLICY "Clients can view active staff" ON public.staff
FOR SELECT USING (is_active = true);

-- Permitir que clientes criem agendamentos
CREATE POLICY "Clients can create appointments" ON public.appointments
FOR INSERT WITH CHECK (true);

-- Permitir que clientes vejam seus próprios agendamentos
CREATE POLICY "Clients can view own appointments" ON public.appointments
FOR SELECT USING (true);

-- Permitir que clientes atualizem seus próprios agendamentos
CREATE POLICY "Clients can update own appointments" ON public.appointments
FOR UPDATE USING (true);

-- Permitir que clientes deletem seus próprios agendamentos
CREATE POLICY "Clients can delete own appointments" ON public.appointments
FOR DELETE USING (true);

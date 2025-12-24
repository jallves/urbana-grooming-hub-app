-- ============================================
-- 1. CONSOLIDAR POLÍTICAS RLS DA TABELA APPOINTMENTS
-- ============================================

-- Remover todas as políticas conflitantes
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow full access to admin users" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbeiros podem visualizar seus agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can update own pending appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.appointments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable update for all users" ON public.appointments;
DROP POLICY IF EXISTS "Staff can update assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can view assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

-- Criar políticas consolidadas e seguras

-- 1. Admins/Managers têm acesso total
CREATE POLICY "Admin roles full access to appointments" 
ON public.appointments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- 2. Clientes podem ver seus próprios agendamentos
CREATE POLICY "Clients view own appointments" 
ON public.appointments FOR SELECT TO authenticated
USING (
  client_id = auth.uid() OR
  client_id IN (SELECT id FROM clients WHERE email = auth.email())
);

-- 3. Clientes podem criar agendamentos
CREATE POLICY "Clients create own appointments" 
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (
  client_id = auth.uid() OR
  client_id IN (SELECT id FROM clients WHERE email = auth.email())
);

-- 4. Clientes podem atualizar seus agendamentos pendentes
CREATE POLICY "Clients update pending appointments" 
ON public.appointments FOR UPDATE TO authenticated
USING (
  (client_id = auth.uid() OR client_id IN (SELECT id FROM clients WHERE email = auth.email()))
  AND status IN ('scheduled', 'confirmed')
)
WITH CHECK (
  client_id = auth.uid() OR client_id IN (SELECT id FROM clients WHERE email = auth.email())
);

-- 5. Staff/Barbeiros podem ver agendamentos atribuídos a eles
CREATE POLICY "Staff view assigned appointments" 
ON public.appointments FOR SELECT TO authenticated
USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

-- 6. Staff/Barbeiros podem atualizar agendamentos atribuídos a eles
CREATE POLICY "Staff update assigned appointments" 
ON public.appointments FOR UPDATE TO authenticated
USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
)
WITH CHECK (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);
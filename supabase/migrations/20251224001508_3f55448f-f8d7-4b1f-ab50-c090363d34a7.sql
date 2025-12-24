-- ============================================
-- REMOVER TODAS AS POLÍTICAS PÚBLICAS DE TABELAS SENSÍVEIS
-- ============================================

-- 1. FINANCIAL_RECORDS - Remover políticas públicas
DROP POLICY IF EXISTS "Public view financial_records" ON public.financial_records;
DROP POLICY IF EXISTS "System can insert financial_records" ON public.financial_records;

-- 2. FINANCE_TRANSACTIONS - Remover políticas públicas
DROP POLICY IF EXISTS "Allow system to create finance transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Barbers can view own transactions" ON public.finance_transactions;

-- Recriar política de barbeiros como authenticated
CREATE POLICY "Barbers can view own transactions authenticated" 
ON public.finance_transactions FOR SELECT TO authenticated
USING (barbeiro_id IN (
  SELECT s.id FROM staff s
  JOIN painel_barbeiros pb ON s.id = pb.staff_id
  WHERE s.email = auth.email()
));

-- 3. PAGAMENTOS - Remover políticas públicas
DROP POLICY IF EXISTS "Public can create pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Public can view pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Totem pode gerenciar pagamentos" ON public.pagamentos;

-- 4. PAINEL_AGENDAMENTOS - Remover políticas públicas e criar autenticadas
DROP POLICY IF EXISTS "Clients can create appointments" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Clients can update own appointments" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Public can create appointments" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Public can view appointments" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "barbers_cannot_delete_appointments" ON public.painel_agendamentos;

-- Criar políticas autenticadas para clientes
CREATE POLICY "Authenticated clients can view own appointments" 
ON public.painel_agendamentos FOR SELECT TO authenticated
USING (cliente_id = auth.uid() OR 
       has_role(auth.uid(), 'master'::app_role) OR 
       has_role(auth.uid(), 'admin'::app_role) OR 
       has_role(auth.uid(), 'manager'::app_role) OR
       barbeiro_id IN (
         SELECT pb.id FROM painel_barbeiros pb
         JOIN staff s ON pb.staff_id = s.id
         WHERE s.user_id = auth.uid()
       ));

CREATE POLICY "Authenticated clients can create appointments" 
ON public.painel_agendamentos FOR INSERT TO authenticated
WITH CHECK (cliente_id = auth.uid() OR 
            has_role(auth.uid(), 'master'::app_role) OR 
            has_role(auth.uid(), 'admin'::app_role) OR 
            has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Authenticated clients can update own appointments" 
ON public.painel_agendamentos FOR UPDATE TO authenticated
USING (cliente_id = auth.uid() OR 
       has_role(auth.uid(), 'master'::app_role) OR 
       has_role(auth.uid(), 'admin'::app_role) OR 
       has_role(auth.uid(), 'manager'::app_role) OR
       barbeiro_id IN (
         SELECT pb.id FROM painel_barbeiros pb
         JOIN staff s ON pb.staff_id = s.id
         WHERE s.user_id = auth.uid()
       ));

-- 5. PAINEL_BARBEIROS - Remover política pública e criar view segura
DROP POLICY IF EXISTS "Public can view active barbers" ON public.painel_barbeiros;

-- Criar view pública para informações básicas de barbeiros (para agendamento)
CREATE OR REPLACE VIEW public.barbers_public_booking AS
SELECT 
  id,
  nome,
  image_url,
  specialties,
  is_active,
  available_for_booking
FROM public.painel_barbeiros
WHERE is_active = true AND available_for_booking = true;

GRANT SELECT ON public.barbers_public_booking TO anon;
GRANT SELECT ON public.barbers_public_booking TO authenticated;

-- Função segura para obter barbeiros para agendamento
CREATE OR REPLACE FUNCTION public.get_barbers_for_booking()
RETURNS TABLE (
  id uuid,
  nome text,
  image_url text,
  specialties text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, image_url, specialties
  FROM public.painel_barbeiros
  WHERE is_active = true AND available_for_booking = true;
$$;

-- 6. PAYMENT_RECORDS - Remover políticas públicas
DROP POLICY IF EXISTS "Public can view payment_records" ON public.payment_records;
DROP POLICY IF EXISTS "System can insert payment_records" ON public.payment_records;

-- 7. TOTEM_PAYMENTS - Remover políticas públicas
DROP POLICY IF EXISTS "Allow public access to totem_payments" ON public.totem_payments;

-- 8. TOTEM_SESSIONS - Remover políticas públicas
DROP POLICY IF EXISTS "Allow public access to totem_sessions" ON public.totem_sessions;

-- 9. VENDAS - Remover políticas públicas
DROP POLICY IF EXISTS "Public can create vendas" ON public.vendas;
DROP POLICY IF EXISTS "Public can view vendas" ON public.vendas;
DROP POLICY IF EXISTS "Totem pode atualizar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Totem pode criar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Totem pode ler vendas" ON public.vendas;

-- 10. VENDAS_ITENS - Remover políticas públicas
DROP POLICY IF EXISTS "Public can create vendas_itens" ON public.vendas_itens;
DROP POLICY IF EXISTS "Public can view vendas_itens" ON public.vendas_itens;
DROP POLICY IF EXISTS "Totem pode gerenciar itens" ON public.vendas_itens;
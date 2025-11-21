-- Migration: Garantir acesso total do master a todos os módulos financeiros
-- Atualiza as policies RLS para incluir o role 'master' em todas as tabelas financeiras

-- =======================
-- FINANCIAL_RECORDS
-- =======================

-- Remover policy antiga que só verifica 'admin'
DROP POLICY IF EXISTS "Admins can manage financial_records" ON public.financial_records;

-- Criar nova policy que inclui 'master' e 'admin'
CREATE POLICY "Masters and admins can manage financial_records"
ON public.financial_records
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- FINANCE_TRANSACTIONS
-- =======================

-- Remover policy antiga
DROP POLICY IF EXISTS "Admins can manage finance transactions" ON public.finance_transactions;

-- Criar nova policy
CREATE POLICY "Masters and admins can manage finance transactions"
ON public.finance_transactions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- CASH_FLOW
-- =======================

-- Remover policy antiga
DROP POLICY IF EXISTS "Admins can manage cash flow" ON public.cash_flow;

-- Criar nova policy
CREATE POLICY "Masters and admins can manage cash flow"
ON public.cash_flow
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- FIXED_EXPENSES
-- =======================

-- Remover policy antiga
DROP POLICY IF EXISTS "Admins can manage fixed expenses" ON public.fixed_expenses;

-- Criar nova policy
CREATE POLICY "Masters and admins can manage fixed expenses"
ON public.fixed_expenses
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- CASH_FLOW_CATEGORIES
-- =======================

-- Remover policy antiga
DROP POLICY IF EXISTS "Admins can manage categories" ON public.cash_flow_categories;

-- Criar nova policy
CREATE POLICY "Masters and admins can manage cash flow categories"
ON public.cash_flow_categories
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- BARBER_COMMISSIONS
-- =======================

-- Remover policies antigas que só verificam 'admin'
DROP POLICY IF EXISTS "Admins can view all commissions" ON public.barber_commissions;
DROP POLICY IF EXISTS "Admins can insert commissions" ON public.barber_commissions;
DROP POLICY IF EXISTS "Admins can update all commissions" ON public.barber_commissions;
DROP POLICY IF EXISTS "Admins podem ver todas as comissões" ON public.barber_commissions;
DROP POLICY IF EXISTS "Admins podem atualizar comissões" ON public.barber_commissions;

-- Criar nova policy unificada para SELECT
CREATE POLICY "Masters and admins can view all commissions"
ON public.barber_commissions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  barber_id IN (
    SELECT staff.id
    FROM staff
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

-- Criar nova policy para INSERT
CREATE POLICY "Masters and admins can insert commissions"
ON public.barber_commissions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Criar nova policy para UPDATE
CREATE POLICY "Masters and admins can update commissions"
ON public.barber_commissions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Criar nova policy para DELETE
CREATE POLICY "Masters and admins can delete commissions"
ON public.barber_commissions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);
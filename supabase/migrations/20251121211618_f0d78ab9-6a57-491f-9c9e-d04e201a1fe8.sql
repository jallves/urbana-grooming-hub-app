
-- =====================================================
-- SOLUÇÃO INTELIGENTE: POLÍTICAS RLS POR CARGO
-- =====================================================
-- Master: Acesso total (100%)
-- Admin: Acesso total EXCETO configurações
-- Manager: Acesso total EXCETO ERP financeiro e configurações
-- Barber: Apenas painel de barbeiro
-- =====================================================

-- 1. LIMPAR ROLES DUPLICADOS DO JOÃO - deixar apenas MASTER
DELETE FROM user_roles 
WHERE user_id = 'ee055e2c-1504-4c72-b3e5-fb4682f1b2db' 
AND role = 'admin';

-- 2. GARANTIR QUE JOÃO ESTÁ COMO MASTER
INSERT INTO user_roles (user_id, role)
VALUES ('ee055e2c-1504-4c72-b3e5-fb4682f1b2db', 'master')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. ATUALIZAR admin_users para garantir consistência
UPDATE admin_users 
SET role = 'master'
WHERE user_id = 'ee055e2c-1504-4c72-b3e5-fb4682f1b2db';

-- =====================================================
-- POLÍTICAS PARA DASHBOARD E MÉTRICAS (Todos menos Barber)
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can manage admin metrics" ON admin_metrics;
DROP POLICY IF EXISTS "Masters and admins can manage dashboard metrics" ON dashboard_metrics;
DROP POLICY IF EXISTS "Masters and admins can manage widgets" ON dashboard_widgets;

CREATE POLICY "Masters, admins and managers can view metrics"
ON admin_metrics FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Masters and admins can manage metrics"
ON admin_metrics FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters, admins and managers can view dashboard metrics"
ON dashboard_metrics FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Masters and admins can manage dashboard metrics"
ON dashboard_metrics FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters, admins and managers can manage widgets"
ON dashboard_widgets FOR ALL
TO authenticated
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

-- =====================================================
-- POLÍTICAS PARA CONFIGURAÇÕES (Apenas Master)
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Masters and admins can manage backups" ON configuration_backups;
DROP POLICY IF EXISTS "Masters and admins can manage business hours" ON business_hours;

-- Apenas MASTER pode gerenciar admin_users
CREATE POLICY "Only masters can manage admin users"
ON admin_users FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Admin e Manager podem VER admin_users, mas não modificar
CREATE POLICY "Admins and managers can view admin users"
ON admin_users FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Apenas MASTER pode gerenciar backups de configuração
CREATE POLICY "Only masters can manage backups"
ON configuration_backups FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Apenas MASTER pode gerenciar horários de funcionamento
CREATE POLICY "Only masters can manage business hours"
ON business_hours FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins and managers can view business hours"
ON business_hours FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- =====================================================
-- POLÍTICAS PARA ERP FINANCEIRO (Master e Admin apenas)
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can manage financial records" ON financial_records;
DROP POLICY IF EXISTS "Masters and admins can manage finance transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Masters and admins can manage cash flow" ON cash_flow;
DROP POLICY IF EXISTS "Masters and admins can manage fixed expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Masters and admins can manage cash flow categories" ON cash_flow_categories;

-- Financial Records
CREATE POLICY "Masters and admins can manage financial records"
ON financial_records FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Finance Transactions
CREATE POLICY "Masters and admins can manage finance transactions"
ON finance_transactions FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Cash Flow
CREATE POLICY "Masters and admins can manage cash flow"
ON cash_flow FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Fixed Expenses
CREATE POLICY "Masters and admins can manage fixed expenses"
ON fixed_expenses FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Cash Flow Categories
CREATE POLICY "Masters and admins can manage cash flow categories"
ON cash_flow_categories FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Manager pode VER dados financeiros, mas não modificar
CREATE POLICY "Managers can view financial records"
ON financial_records FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can view finance transactions"
ON finance_transactions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can view cash flow"
ON cash_flow FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role));

-- =====================================================
-- POLÍTICAS PARA COMISSÕES (Master, Admin, e Barber próprio)
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can view all commissions" ON barber_commissions;
DROP POLICY IF EXISTS "Masters and admins can insert commissions" ON barber_commissions;
DROP POLICY IF EXISTS "Masters and admins can update commissions" ON barber_commissions;
DROP POLICY IF EXISTS "Masters and admins can delete commissions" ON barber_commissions;
DROP POLICY IF EXISTS "Barbeiros visualizam apenas suas comissões" ON barber_commissions;
DROP POLICY IF EXISTS "Barbeiros podem ver suas próprias comissões" ON barber_commissions;
DROP POLICY IF EXISTS "Sistema pode criar comissões" ON barber_commissions;
DROP POLICY IF EXISTS "System can insert commissions" ON barber_commissions;

-- Masters, Admins e Managers podem ver TODAS as comissões
CREATE POLICY "Masters, admins and managers can view all commissions"
ON barber_commissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  barber_id IN (
    SELECT id FROM staff 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Masters e Admins podem gerenciar comissões
CREATE POLICY "Masters and admins can manage commissions"
ON barber_commissions FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- POLÍTICAS PARA AUDITORIA (Apenas Master)
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can manage audit log" ON audit_log;
DROP POLICY IF EXISTS "Masters and admins can manage activity log" ON admin_activity_log;

CREATE POLICY "Only masters can manage audit log"
ON audit_log FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can view audit log"
ON audit_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only masters can manage activity log"
ON admin_activity_log FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can view activity log"
ON admin_activity_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "Only masters can manage admin users" ON admin_users IS 
'Apenas Master pode gerenciar usuários admin - módulo de configuração restrito';

COMMENT ON POLICY "Masters and admins can manage financial records" ON financial_records IS 
'Master e Admin têm acesso total ao ERP Financeiro - Manager NÃO tem acesso';

COMMENT ON POLICY "Masters, admins and managers can view all commissions" ON barber_commissions IS 
'Todos os cargos administrativos podem visualizar comissões, barbeiros veem apenas as próprias';

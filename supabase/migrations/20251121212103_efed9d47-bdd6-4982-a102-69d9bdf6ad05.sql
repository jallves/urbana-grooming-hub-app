
-- =====================================================
-- CORREÇÃO: POLÍTICAS APENAS NO MENU, NÃO NOS DADOS
-- =====================================================
-- Se o usuário tem acesso ao módulo (vê no menu),
-- ele tem acesso TOTAL aos dados daquele módulo.
-- A restrição é feita removendo o item do menu.
-- =====================================================

-- =====================================================
-- DASHBOARD: Master, Admin e Manager têm acesso total
-- =====================================================

DROP POLICY IF EXISTS "Masters, admins and managers can view metrics" ON admin_metrics;
DROP POLICY IF EXISTS "Masters and admins can manage metrics" ON admin_metrics;
DROP POLICY IF EXISTS "Masters, admins and managers can view dashboard metrics" ON dashboard_metrics;
DROP POLICY IF EXISTS "Masters and admins can manage dashboard metrics" ON dashboard_metrics;
DROP POLICY IF EXISTS "Masters, admins and managers can manage widgets" ON dashboard_widgets;

-- Admin Metrics: Todos os roles administrativos têm acesso total
CREATE POLICY "Admin roles can manage admin metrics"
ON admin_metrics FOR ALL
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

-- Dashboard Metrics: Todos os roles administrativos têm acesso total
CREATE POLICY "Admin roles can manage dashboard metrics"
ON dashboard_metrics FOR ALL
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

-- Dashboard Widgets: Todos os roles administrativos têm acesso total
CREATE POLICY "Admin roles can manage widgets"
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
-- ERP FINANCEIRO: Apenas Master e Admin têm acesso
-- Manager NÃO vê o módulo no menu
-- =====================================================

-- Financial Records, Finance Transactions, Cash Flow, Fixed Expenses, Cash Flow Categories
-- Mantém restrição apenas para Master e Admin

-- =====================================================
-- CONFIGURAÇÕES: Apenas Master tem acesso
-- Admin e Manager NÃO veem o módulo no menu
-- =====================================================

-- admin_users, configuration_backups, business_hours
-- Mantém restrição apenas para Master

-- =====================================================
-- OUTROS MÓDULOS: Master, Admin e Manager têm acesso total
-- =====================================================

DROP POLICY IF EXISTS "Managers can view employees" ON employees;
DROP POLICY IF EXISTS "Masters and admins can manage employees" ON employees;

-- Employees: Todos os roles administrativos têm acesso total
CREATE POLICY "Admin roles can manage employees"
ON employees FOR ALL
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

-- Staff: Todos os roles administrativos têm acesso total
DROP POLICY IF EXISTS "Masters and admins can manage staff" ON staff;
DROP POLICY IF EXISTS "Staff members can view own data" ON staff;

CREATE POLICY "Admin roles can manage staff"
ON staff FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Painel Agendamentos: Todos os roles administrativos têm acesso total
DROP POLICY IF EXISTS "Masters and admins can manage appointments" ON painel_agendamentos;
DROP POLICY IF EXISTS "Barbeiros podem visualizar seus agendamentos" ON painel_agendamentos;
DROP POLICY IF EXISTS "Public can create appointments" ON painel_agendamentos;
DROP POLICY IF EXISTS "Public can view appointments" ON painel_agendamentos;

CREATE POLICY "Admin roles can manage appointments"
ON painel_agendamentos FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  barbeiro_id IN (
    SELECT pb.id FROM painel_barbeiros pb
    JOIN staff s ON pb.staff_id = s.id
    WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Public can create appointments"
ON painel_agendamentos FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view appointments"
ON painel_agendamentos FOR SELECT
TO public
USING (true);

-- Painel Clientes: Todos os roles administrativos têm acesso total
DROP POLICY IF EXISTS "Masters and admins can manage clients" ON painel_clientes;
DROP POLICY IF EXISTS "Public can view clients" ON painel_clientes;
DROP POLICY IF EXISTS "Public can insert clients" ON painel_clientes;
DROP POLICY IF EXISTS "Public can update clients" ON painel_clientes;

CREATE POLICY "Admin roles can manage clients"
ON painel_clientes FOR ALL
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

CREATE POLICY "Public can view clients"
ON painel_clientes FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can insert clients"
ON painel_clientes FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can update clients"
ON painel_clientes FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Painel Produtos: Todos os roles administrativos têm acesso total
DROP POLICY IF EXISTS "Masters and admins can manage products" ON painel_produtos;
DROP POLICY IF EXISTS "Public can view products" ON painel_produtos;

CREATE POLICY "Admin roles can manage products"
ON painel_produtos FOR ALL
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

CREATE POLICY "Public can view products"
ON painel_produtos FOR SELECT
TO public
USING (true);

-- Painel Servicos: Todos os roles administrativos têm acesso total
DROP POLICY IF EXISTS "Masters and admins can manage services" ON painel_servicos;
DROP POLICY IF EXISTS "Public can view services" ON painel_servicos;

CREATE POLICY "Admin roles can manage services"
ON painel_servicos FOR ALL
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

CREATE POLICY "Public can view services"
ON painel_servicos FOR SELECT
TO public
USING (true);

-- Comissões: Todos os roles administrativos podem ver, Master e Admin podem gerenciar
DROP POLICY IF EXISTS "Masters, admins and managers can view all commissions" ON barber_commissions;
DROP POLICY IF EXISTS "Masters and admins can manage commissions" ON barber_commissions;

CREATE POLICY "Admin roles can view commissions"
ON barber_commissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  barber_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
);

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
-- RESUMO DAS POLÍTICAS POR MÓDULO
-- =====================================================

COMMENT ON TABLE admin_metrics IS 
'Dashboard - Acesso: Master, Admin, Manager (todos têm acesso total aos dados)';

COMMENT ON TABLE financial_records IS 
'ERP Financeiro - Acesso: Master, Admin (Manager NÃO vê no menu)';

COMMENT ON TABLE admin_users IS 
'Configurações - Acesso: Master (Admin e Manager NÃO veem no menu)';

COMMENT ON TABLE employees IS 
'Funcionários - Acesso: Master, Admin, Manager (todos têm acesso total aos dados)';

COMMENT ON TABLE painel_agendamentos IS 
'Agendamentos - Acesso: Master, Admin, Manager (todos têm acesso total aos dados)';

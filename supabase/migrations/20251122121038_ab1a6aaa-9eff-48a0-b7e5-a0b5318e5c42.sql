
-- =========================================
-- MIGRAÇÃO: Políticas RLS robustas para o fluxo de autenticação de barbeiros
-- =========================================
-- 
-- Fluxo correto:
-- 1. Admin cria funcionário no módulo "Funcionários"
-- 2. Se cargo = "barbeiro" → sistema migra automaticamente para tabela staff
-- 3. Admin vai no módulo "Barbeiros" e cria senha de autenticação
-- 4. Edge function cria usuário e vincula user_id em employees, staff e user_roles
--
-- Esta migração garante que as políticas suportem esse fluxo corretamente
-- =========================================

-- ==========================================
-- 1. TABELA EMPLOYEES: Políticas para criação e vinculação de user_id
-- ==========================================

-- Permitir que service_role (edge functions) atualize user_id
DROP POLICY IF EXISTS "Service role can update employees" ON employees;
CREATE POLICY "Service role can update employees"
  ON employees
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Garantir que admins podem gerenciar employees
DROP POLICY IF EXISTS "Admin roles can manage employees" ON employees;
CREATE POLICY "Admin roles can manage employees"
  ON employees
  FOR ALL
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

-- Funcionários podem ver seus próprios dados
DROP POLICY IF EXISTS "Employees can view own data" ON employees;
CREATE POLICY "Employees can view own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- 2. TABELA STAFF: Políticas para criação e vinculação de user_id
-- ==========================================

-- Permitir que service_role (edge functions) atualize user_id
DROP POLICY IF EXISTS "Service role can update staff" ON staff;
CREATE POLICY "Service role can update staff"
  ON staff
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Garantir que admins podem gerenciar staff
DROP POLICY IF EXISTS "Admin roles have full access" ON staff;
CREATE POLICY "Admin roles have full access"
  ON staff
  FOR ALL
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

-- Staff pode gerenciar seu próprio perfil
DROP POLICY IF EXISTS "Staff can manage own profile" ON staff;
CREATE POLICY "Staff can manage own profile"
  ON staff
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Público pode ver staff ativo (para agendamentos)
DROP POLICY IF EXISTS "Public can view active staff" ON staff;
CREATE POLICY "Public can view active staff"
  ON staff
  FOR SELECT
  TO public
  USING (is_active = true);

-- ==========================================
-- 3. TABELA USER_ROLES: Políticas para criação de roles
-- ==========================================

-- Permitir que service_role (edge functions) insira roles
DROP POLICY IF EXISTS "Service role can insert roles" ON user_roles;
CREATE POLICY "Service role can insert roles"
  ON user_roles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir que service_role (edge functions) atualize roles (caso necessário)
DROP POLICY IF EXISTS "Service role can update roles" ON user_roles;
CREATE POLICY "Service role can update roles"
  ON user_roles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usuários podem ver suas próprias roles
DROP POLICY IF EXISTS "Users view own roles" ON user_roles;
CREATE POLICY "Users view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Público e autenticados podem ler todas as roles (necessário para has_role)
DROP POLICY IF EXISTS "Public can read all roles" ON user_roles;
CREATE POLICY "Public can read all roles"
  ON user_roles
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated can read all roles" ON user_roles;
CREATE POLICY "Authenticated can read all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins podem gerenciar roles
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles"
  ON user_roles
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

-- ==========================================
-- 4. COMENTÁRIOS EXPLICATIVOS
-- ==========================================
COMMENT ON POLICY "Service role can update employees" ON employees IS 
  'Permite que edge functions (manage-barber-user) vinculem user_id ao criar autenticação';

COMMENT ON POLICY "Service role can update staff" ON staff IS 
  'Permite que edge functions (manage-barber-user) vinculem user_id ao criar autenticação';

COMMENT ON POLICY "Service role can insert roles" ON user_roles IS 
  'Permite que edge functions (manage-barber-user) criem role de barber ao criar autenticação';

-- ==========================================
-- FIM DA MIGRAÇÃO
-- ==========================================


-- =====================================================
-- REMOVER POLÍTICAS QUE ACESSAM auth.users
-- =====================================================

-- Remover política problemática que acessa auth.users
DROP POLICY IF EXISTS "Staff can manage own profile" ON staff;

-- Limpar políticas duplicadas e criar apenas as essenciais
DROP POLICY IF EXISTS "Admin roles can manage staff" ON staff;
DROP POLICY IF EXISTS "Masters and admins full access to staff" ON staff;
DROP POLICY IF EXISTS "Allow clients to view active staff for appointments" ON staff;
DROP POLICY IF EXISTS "Allow public read access to active barbers" ON staff;
DROP POLICY IF EXISTS "Allow public read access to active staff" ON staff;
DROP POLICY IF EXISTS "Authenticated users can view active staff" ON staff;
DROP POLICY IF EXISTS "Clients can view active staff for booking" ON staff;
DROP POLICY IF EXISTS "Funcionários podem atualizar seus próprios dados" ON staff;
DROP POLICY IF EXISTS "Funcionários podem visualizar seus próprios dados" ON staff;
DROP POLICY IF EXISTS "Public can view active barbers" ON staff;
DROP POLICY IF EXISTS "Public can view active staff" ON staff;
DROP POLICY IF EXISTS "Public can view active staff for booking" ON staff;
DROP POLICY IF EXISTS "Staff can view own profile" ON staff;

-- =====================================================
-- CRIAR POLÍTICAS CORRETAS SEM ACESSAR auth.users
-- =====================================================

-- 1. Admin roles têm acesso total
CREATE POLICY "Admin roles have full access"
ON staff FOR ALL
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

-- 2. Staff pode ver e atualizar seu próprio perfil (usando user_id, não auth.users)
CREATE POLICY "Staff can manage own profile"
ON staff FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Público pode ver staff ativo (para agendamento)
CREATE POLICY "Public can view active staff"
ON staff FOR SELECT
TO public
USING (is_active = true);

COMMENT ON POLICY "Admin roles have full access" ON staff IS 
'Master, Admin e Manager têm acesso total sem acessar auth.users';

COMMENT ON POLICY "Staff can manage own profile" ON staff IS 
'Funcionários podem gerenciar seu próprio perfil usando user_id ao invés de auth.users';

COMMENT ON POLICY "Public can view active staff" ON staff IS 
'Público pode ver staff ativo para agendamento';

-- Remover políticas RLS com recursão e criar novas seguras

-- Dropar todas as políticas antigas da tabela staff
DROP POLICY IF EXISTS "Admins can manage staff" ON staff;
DROP POLICY IF EXISTS "Admins and managers can view staff" ON staff;
DROP POLICY IF EXISTS "Staff can view own data" ON staff;
DROP POLICY IF EXISTS "Barbers can view own data" ON staff;
DROP POLICY IF EXISTS "Anyone can view active staff" ON staff;
DROP POLICY IF EXISTS "Public can view active staff" ON staff;

-- Criar políticas RLS seguras para staff usando has_role
CREATE POLICY "Admins can manage staff"
ON staff
FOR ALL
USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view own profile"
ON staff
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Public can view active staff"
ON staff
FOR SELECT
USING (is_active = true);

-- Dropar políticas antigas da tabela employees que causam recursão
DROP POLICY IF EXISTS "Admins and managers can view employees" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;

-- Recriar políticas seguras para employees
CREATE POLICY "Admins and managers can view employees"
ON employees
FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can manage employees"
ON employees
FOR ALL
USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
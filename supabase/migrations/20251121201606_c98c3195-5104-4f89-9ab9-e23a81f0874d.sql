-- Corrigir recursão infinita e adicionar role master

-- 1. Adicionar 'master' ao check constraint de role na tabela employees
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
CHECK (role IN ('admin', 'manager', 'barber', 'master'));

-- 2. Dropar políticas que dependem de has_role
DROP POLICY IF EXISTS "Admins podem ver todas as comissões" ON barber_commissions;
DROP POLICY IF EXISTS "Admins podem atualizar comissões" ON barber_commissions;

-- 3. Dropar e recriar a função has_role com SECURITY DEFINER
DROP FUNCTION IF EXISTS has_role(uuid, app_role) CASCADE;

CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Recriar as políticas que foram dropadas
CREATE POLICY "Admins podem ver todas as comissões"
ON barber_commissions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar comissões"
ON barber_commissions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Dropar políticas problemáticas da tabela user_roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;

-- 6. Criar políticas seguras sem recursão para user_roles
CREATE POLICY "Enable read for authenticated users"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage user_roles"
ON user_roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Inserir João Colimoides como master na tabela employees (se ainda não existir)
INSERT INTO employees (id, name, email, phone, role, status, user_id)
SELECT 
  gen_random_uuid(),
  'João Colimoides',
  'joao.colimoides@gmail.com',
  '00000000000',
  'master',
  'active',
  u.id
FROM auth.users u
WHERE u.email = 'joao.colimoides@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM employees WHERE email = 'joao.colimoides@gmail.com'
  );

-- 8. Garantir que João tenha a role master em user_roles
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'joao.colimoides@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'master'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
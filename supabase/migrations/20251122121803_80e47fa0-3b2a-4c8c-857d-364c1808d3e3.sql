
-- Correção: Vincular user_id existentes e garantir role na user_roles
-- Para o usuário ursocara2@gmail.com especificamente

-- 1. Atualizar employees com user_id correto
UPDATE employees
SET user_id = 'c2123613-0907-4211-9cd8-7a7f92b79aad'
WHERE email = 'ursocara2@gmail.com' AND user_id IS NULL;

-- 2. Atualizar staff com user_id correto
UPDATE staff
SET user_id = 'c2123613-0907-4211-9cd8-7a7f92b79aad'
WHERE email = 'ursocara2@gmail.com' AND user_id IS NULL;

-- 3. Inserir role na user_roles (se não existir)
INSERT INTO user_roles (user_id, role)
VALUES ('c2123613-0907-4211-9cd8-7a7f92b79aad', 'barber')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Criar função para sincronizar automaticamente quando user_id for atualizado em staff
CREATE OR REPLACE FUNCTION sync_barber_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Quando um staff com role 'barber' recebe user_id, garantir que existe na user_roles
  IF NEW.role = 'barber' AND NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'barber')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS trigger_sync_barber_user_role ON staff;
CREATE TRIGGER trigger_sync_barber_user_role
  AFTER UPDATE OF user_id ON staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_barber_user_role();

-- 6. Também criar trigger para INSERT caso o user_id já venha preenchido
DROP TRIGGER IF EXISTS trigger_sync_barber_user_role_on_insert ON staff;
CREATE TRIGGER trigger_sync_barber_user_role_on_insert
  AFTER INSERT ON staff
  FOR EACH ROW
  WHEN (NEW.role = 'barber' AND NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION sync_barber_user_role();

COMMENT ON FUNCTION sync_barber_user_role() IS 'Sincroniza automaticamente a role barber na tabela user_roles quando um staff barber recebe user_id';

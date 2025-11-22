-- Função para sincronizar employee role com user_roles
CREATE OR REPLACE FUNCTION sync_employee_to_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o employee tem um user_id válido, sincronizar com user_roles
  IF NEW.user_id IS NOT NULL THEN
    -- Inserir ou atualizar o role em user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role::app_role)
    ON CONFLICT (user_id, role) 
    DO NOTHING;
    
    -- Se o role mudou, remover o role antigo
    IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
      DELETE FROM public.user_roles 
      WHERE user_id = NEW.user_id 
      AND role = OLD.role::app_role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar automaticamente quando employee for criado/atualizado
DROP TRIGGER IF EXISTS sync_employee_role_trigger ON public.employees;
CREATE TRIGGER sync_employee_role_trigger
  AFTER INSERT OR UPDATE OF user_id, role
  ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_to_user_roles();

-- Sincronizar employees existentes que já têm user_id
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT e.user_id, e.role::app_role
FROM public.employees e
WHERE e.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = e.user_id AND ur.role = e.role::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Garantir que a tabela employees tem RLS habilitado
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Política para permitir que admins e managers vejam employees
DROP POLICY IF EXISTS "Admin roles can view employees" ON public.employees;
CREATE POLICY "Admin roles can view employees"
ON public.employees
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'master'::app_role)
);

-- Política para permitir que admins e masters gerenciem employees
DROP POLICY IF EXISTS "Admin roles can manage employees" ON public.employees;
CREATE POLICY "Admin roles can manage employees"
ON public.employees
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);
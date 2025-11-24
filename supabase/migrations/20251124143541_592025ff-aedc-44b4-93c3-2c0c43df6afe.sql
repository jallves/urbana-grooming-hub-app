
-- Políticas RLS para tabela staff
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admin e Manager podem gerenciar staff" ON public.staff;
DROP POLICY IF EXISTS "Admin e Manager podem visualizar staff" ON public.staff;
DROP POLICY IF EXISTS "Admin e Manager podem inserir staff" ON public.staff;
DROP POLICY IF EXISTS "Admin e Manager podem atualizar staff" ON public.staff;
DROP POLICY IF EXISTS "Admin e Manager podem deletar staff" ON public.staff;

-- Política para SELECT
CREATE POLICY "Admin e Manager podem visualizar staff"
ON public.staff
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Política para INSERT
CREATE POLICY "Admin e Manager podem inserir staff"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Política para UPDATE
CREATE POLICY "Admin e Manager podem atualizar staff"
ON public.staff
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Política para DELETE
CREATE POLICY "Admin e Manager podem deletar staff"
ON public.staff
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Políticas RLS para tabela employees
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admin e Manager podem gerenciar employees" ON public.employees;
DROP POLICY IF EXISTS "Admin e Manager podem visualizar employees" ON public.employees;
DROP POLICY IF EXISTS "Admin e Manager podem inserir employees" ON public.employees;
DROP POLICY IF EXISTS "Admin e Manager podem atualizar employees" ON public.employees;
DROP POLICY IF EXISTS "Admin e Manager podem deletar employees" ON public.employees;

-- Política para SELECT
CREATE POLICY "Admin e Manager podem visualizar employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Política para INSERT
CREATE POLICY "Admin e Manager podem inserir employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Política para UPDATE
CREATE POLICY "Admin e Manager podem atualizar employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Política para DELETE
CREATE POLICY "Admin e Manager podem deletar employees"
ON public.employees
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'manager'::app_role)
);


-- Inserir barbeiros ativos da tabela staff na tabela user_roles
-- Cada barbeiro receberá a role 'barber'
INSERT INTO public.user_roles (user_id, role)
SELECT 
  s.id as user_id,
  'barber'::app_role as role
FROM public.staff s
WHERE s.is_active = true
  AND s.role = 'barber'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = s.id 
      AND ur.role = 'barber'::app_role
  );

-- Também inserir administradores se houver algum na tabela staff
INSERT INTO public.user_roles (user_id, role)
SELECT 
  s.id as user_id,
  'admin'::app_role as role
FROM public.staff s
WHERE s.is_active = true
  AND s.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = s.id 
      AND ur.role = 'admin'::app_role
  );

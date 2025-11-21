-- Criar função is_barber que está faltando
CREATE OR REPLACE FUNCTION public.is_barber(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é barbeiro através da tabela staff
  RETURN EXISTS (
    SELECT 1
    FROM staff s
    WHERE s.user_id = is_barber.user_id
    AND s.role = 'barber'
    AND s.is_active = true
  );
END;
$$;
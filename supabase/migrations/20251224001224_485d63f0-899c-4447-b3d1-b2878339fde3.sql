-- Recriar a view com SECURITY INVOKER para evitar o warning de security definer
DROP VIEW IF EXISTS public.staff_public_booking;

CREATE VIEW public.staff_public_booking 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  image_url,
  specialties,
  is_active
FROM public.staff
WHERE is_active = true;

-- Conceder acesso à view
GRANT SELECT ON public.staff_public_booking TO anon;
GRANT SELECT ON public.staff_public_booking TO authenticated;

-- Como a view usa SECURITY INVOKER e a tabela staff agora não tem políticas públicas,
-- precisamos de uma função SECURITY DEFINER segura para permitir leitura pública dos dados básicos
CREATE OR REPLACE FUNCTION public.get_staff_for_booking()
RETURNS TABLE (
  id uuid,
  name text,
  image_url text,
  specialties text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, image_url, specialties
  FROM public.staff
  WHERE is_active = true;
$$;
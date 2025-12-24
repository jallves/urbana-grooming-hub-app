-- Corrigir a view para usar SECURITY INVOKER
DROP VIEW IF EXISTS public.barbers_public_booking;

CREATE VIEW public.barbers_public_booking 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  image_url,
  specialties,
  is_active,
  available_for_booking
FROM public.painel_barbeiros
WHERE is_active = true AND available_for_booking = true;

GRANT SELECT ON public.barbers_public_booking TO anon;
GRANT SELECT ON public.barbers_public_booking TO authenticated;

-- Remover política pública duplicada de serviços (manter apenas serviços ativos visíveis)
DROP POLICY IF EXISTS "Public can view services" ON public.painel_servicos;

-- Criar view pública segura para serviços (para agendamento)
CREATE OR REPLACE VIEW public.services_public_booking
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  descricao,
  preco,
  duracao,
  is_active
FROM public.painel_servicos
WHERE is_active = true;

GRANT SELECT ON public.services_public_booking TO anon;
GRANT SELECT ON public.services_public_booking TO authenticated;

-- Função segura para obter serviços para agendamento
CREATE OR REPLACE FUNCTION public.get_services_for_booking()
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  preco numeric,
  duracao integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, descricao, preco, duracao
  FROM public.painel_servicos
  WHERE is_active = true;
$$;
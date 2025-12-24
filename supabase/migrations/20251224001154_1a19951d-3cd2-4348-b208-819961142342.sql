-- Remove a política que expõe dados de staff publicamente
DROP POLICY IF EXISTS "Public can view basic staff info for booking" ON public.staff;

-- Criar uma VIEW pública com apenas os dados mínimos necessários para agendamento
-- (id, nome, imagem - sem email, telefone ou outros dados sensíveis)
CREATE OR REPLACE VIEW public.staff_public_booking AS
SELECT 
  id,
  name,
  image_url,
  specialties,
  is_active
FROM public.staff
WHERE is_active = true;

-- Conceder acesso à view para anon e authenticated
GRANT SELECT ON public.staff_public_booking TO anon;
GRANT SELECT ON public.staff_public_booking TO authenticated;
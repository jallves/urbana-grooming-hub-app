
-- Copia todos os barbeiros ativos da staff para staff_sequencial, mantendo o id original no campo uuid_id
INSERT INTO public.staff_sequencial (
  uuid_id,
  name,
  email,
  phone,
  role,
  is_active,
  image_url,
  specialties,
  experience,
  commission_rate,
  created_at,
  updated_at
)
SELECT
  id AS uuid_id,
  name,
  email,
  phone,
  role,
  is_active,
  image_url,
  specialties,
  experience,
  commission_rate,
  created_at,
  updated_at
FROM
  public.staff
WHERE
  role = 'barber';

-- Pronto! Agora é possível usar staff_sequencial nos novos fluxos do sistema.

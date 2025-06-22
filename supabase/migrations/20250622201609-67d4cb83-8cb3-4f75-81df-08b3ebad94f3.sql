
-- Transferir barbeiros da tabela staff para a tabela barbers
INSERT INTO public.barbers (staff_id, created_at, updated_at)
SELECT 
  id as staff_id,
  created_at,
  updated_at
FROM public.staff 
WHERE role = 'barber' 
  AND is_active = true
  AND id NOT IN (SELECT staff_id FROM public.barbers WHERE staff_id IS NOT NULL)
ON CONFLICT (staff_id) DO NOTHING;

-- Garantir que todos os barbeiros ativos tenham entrada na tabela barbers
INSERT INTO public.barbers (staff_id, created_at, updated_at)
SELECT 
  s.id as staff_id,
  COALESCE(s.created_at, now()) as created_at,
  COALESCE(s.updated_at, now()) as updated_at
FROM public.staff s
LEFT JOIN public.barbers b ON s.id = b.staff_id
WHERE s.role = 'barber' 
  AND s.is_active = true
  AND b.staff_id IS NULL;

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_barbers_staff_id ON public.barbers(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_role_active ON public.staff(role, is_active);

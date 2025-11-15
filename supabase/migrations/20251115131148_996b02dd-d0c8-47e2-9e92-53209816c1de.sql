-- Inserir horários de trabalho padrão para todos os barbeiros ativos
-- Horário: Segunda a Sexta das 08:00 às 20:00, Sábado das 08:00 às 18:00

INSERT INTO public.working_hours (staff_id, day_of_week, start_time, end_time, is_active)
SELECT 
  s.id as staff_id,
  d.day_of_week,
  CASE 
    WHEN d.day_of_week = 6 THEN '08:00'::time  -- Sábado
    WHEN d.day_of_week = 0 THEN NULL           -- Domingo fechado
    ELSE '08:00'::time                          -- Segunda a Sexta
  END as start_time,
  CASE 
    WHEN d.day_of_week = 6 THEN '18:00'::time  -- Sábado até 18h
    WHEN d.day_of_week = 0 THEN NULL           -- Domingo fechado
    ELSE '20:00'::time                          -- Segunda a Sexta até 20h
  END as end_time,
  CASE 
    WHEN d.day_of_week = 0 THEN false          -- Domingo inativo
    ELSE true
  END as is_active
FROM public.staff s
CROSS JOIN (
  SELECT generate_series(0, 6) as day_of_week
) d
WHERE s.is_active = true
AND s.role IN ('barber', 'Barbeiro')
AND NOT EXISTS (
  SELECT 1 FROM public.working_hours wh 
  WHERE wh.staff_id = s.id 
  AND wh.day_of_week = d.day_of_week
)
AND d.day_of_week != 0;  -- Não inserir domingo

-- Atualizar timestamps
UPDATE public.working_hours 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_working_hours_staff_day 
ON public.working_hours(staff_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_working_hours_active 
ON public.working_hours(is_active) 
WHERE is_active = true;

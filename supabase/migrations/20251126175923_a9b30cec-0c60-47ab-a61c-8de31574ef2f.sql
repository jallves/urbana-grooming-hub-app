
-- Inserir horários de trabalho padrão para todos os barbeiros ativos
-- Não insere domingo (day_of_week = 0)
INSERT INTO working_hours (staff_id, day_of_week, start_time, end_time, is_active)
SELECT 
  s.id as staff_id,
  dow.day_of_week,
  CASE 
    WHEN dow.day_of_week = 6 THEN '09:00:00'::time  -- Sábado 9h-13h
    ELSE '09:00:00'::time  -- Segunda a Sexta 9h-18h
  END as start_time,
  CASE 
    WHEN dow.day_of_week = 6 THEN '13:00:00'::time  -- Sábado 9h-13h
    ELSE '18:00:00'::time  -- Segunda a Sexta 9h-18h
  END as end_time,
  true as is_active
FROM staff s
CROSS JOIN (
  SELECT generate_series(1, 6) as day_of_week  -- 1=Segunda a 6=Sábado
) dow
WHERE s.is_active = true
  AND s.role = 'barber'
  AND NOT EXISTS (
    SELECT 1 FROM working_hours wh 
    WHERE wh.staff_id = s.id 
    AND wh.day_of_week = dow.day_of_week
  )
ORDER BY s.name, dow.day_of_week;

-- Comentário: Horários padrão criados para segunda a sábado
-- Segunda a Sexta: 09:00 - 18:00
-- Sábado: 09:00 - 13:00
-- Domingo: Não trabalhado (sem registro)

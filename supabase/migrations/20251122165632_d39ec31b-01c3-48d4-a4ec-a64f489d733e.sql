
-- ====================================================================
-- ATUALIZAÇÃO DE HORÁRIOS DE FUNCIONAMENTO DA BARBEARIA
-- ====================================================================
-- Novos horários:
-- Segunda a Sábado: 08:00 às 20:00
-- Domingo: 09:00 às 13:00
-- ====================================================================

-- 1. DELETAR todos os horários existentes
DELETE FROM working_hours;

-- 2. INSERIR novos horários para TODOS os barbeiros ativos
-- Buscar todos os barbeiros ativos e inserir horários padrão

INSERT INTO working_hours (staff_id, day_of_week, start_time, end_time, is_active)
SELECT 
  id as staff_id,
  day_of_week,
  CASE 
    WHEN day_of_week = 0 THEN '09:00:00'::time  -- Domingo: 09:00
    ELSE '08:00:00'::time                        -- Segunda-Sábado: 08:00
  END as start_time,
  CASE 
    WHEN day_of_week = 0 THEN '13:00:00'::time  -- Domingo: 13:00
    ELSE '20:00:00'::time                        -- Segunda-Sábado: 20:00
  END as end_time,
  true as is_active
FROM 
  staff,
  generate_series(0, 6) as day_of_week
WHERE 
  staff.role = 'barber' 
  AND staff.is_active = true;

-- 3. VERIFICAR resultados
-- Esta query mostra quantos registros foram criados por barbeiro
SELECT 
  s.name as barbeiro_nome,
  COUNT(wh.id) as dias_configurados,
  string_agg(
    CASE wh.day_of_week
      WHEN 0 THEN 'Dom'
      WHEN 1 THEN 'Seg'
      WHEN 2 THEN 'Ter'
      WHEN 3 THEN 'Qua'
      WHEN 4 THEN 'Qui'
      WHEN 5 THEN 'Sex'
      WHEN 6 THEN 'Sáb'
    END || ': ' || wh.start_time::text || '-' || wh.end_time::text,
    ', '
    ORDER BY wh.day_of_week
  ) as horarios
FROM staff s
LEFT JOIN working_hours wh ON s.id = wh.staff_id
WHERE s.role = 'barber' AND s.is_active = true
GROUP BY s.id, s.name
ORDER BY s.name;

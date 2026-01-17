-- 1. Vincular painel_barbeiros com staff usando os nomes
UPDATE painel_barbeiros pb
SET staff_id = s.id
FROM staff s
WHERE LOWER(pb.nome) = LOWER(s.name)
  AND pb.staff_id IS NULL;

-- 2. Criar horários de trabalho padrão para Carlos Firme (Segunda a Sábado: 09:00-20:00, Domingo: 09:00-13:00)
INSERT INTO working_hours (staff_id, day_of_week, start_time, end_time, is_active, is_available)
VALUES 
  -- Carlos Firme - Segunda a Sábado
  ('7332a0a1-7615-42d4-955f-66283b2e555e', 1, '09:00', '20:00', true, true), -- Segunda
  ('7332a0a1-7615-42d4-955f-66283b2e555e', 2, '09:00', '20:00', true, true), -- Terça
  ('7332a0a1-7615-42d4-955f-66283b2e555e', 3, '09:00', '20:00', true, true), -- Quarta
  ('7332a0a1-7615-42d4-955f-66283b2e555e', 4, '09:00', '20:00', true, true), -- Quinta
  ('7332a0a1-7615-42d4-955f-66283b2e555e', 5, '09:00', '20:00', true, true), -- Sexta
  ('7332a0a1-7615-42d4-955f-66283b2e555e', 6, '09:00', '20:00', true, true), -- Sábado
  ('7332a0a1-7615-42d4-955f-66283b2e555e', 0, '09:00', '13:00', true, true), -- Domingo
  
  -- Thomas Jefferson - Segunda a Sábado
  ('a533cb27-7729-4ab7-a866-93192ba2bf11', 1, '09:00', '20:00', true, true), -- Segunda
  ('a533cb27-7729-4ab7-a866-93192ba2bf11', 2, '09:00', '20:00', true, true), -- Terça
  ('a533cb27-7729-4ab7-a866-93192ba2bf11', 3, '09:00', '20:00', true, true), -- Quarta
  ('a533cb27-7729-4ab7-a866-93192ba2bf11', 4, '09:00', '20:00', true, true), -- Quinta
  ('a533cb27-7729-4ab7-a866-93192ba2bf11', 5, '09:00', '20:00', true, true), -- Sexta
  ('a533cb27-7729-4ab7-a866-93192ba2bf11', 6, '09:00', '20:00', true, true), -- Sábado
  ('a533cb27-7729-4ab7-a866-93192ba2bf11', 0, '09:00', '13:00', true, true); -- Domingo
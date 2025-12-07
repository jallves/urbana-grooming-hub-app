-- Adicionar horário de funcionamento para domingo (day_of_week = 0) para os dois barbeiros
INSERT INTO working_hours (staff_id, day_of_week, start_time, end_time, is_active)
VALUES 
  -- Carlos Firme
  ('253dfbdb-0977-422f-9b33-b67a482513d3', 0, '08:30:00', '20:00:00', true),
  -- Thomas Jefferson
  ('c1da3ca2-225b-48a3-9e08-66ae6003a17a', 0, '08:30:00', '20:00:00', true);
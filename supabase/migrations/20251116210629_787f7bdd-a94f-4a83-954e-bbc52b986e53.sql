-- Atualizar horários de trabalho para começar às 09:00 (ao invés de 08:00)
-- Horário de funcionamento da barbearia: 09:00 - 20:00
UPDATE working_hours
SET start_time = '09:00:00'
WHERE start_time = '08:00:00';
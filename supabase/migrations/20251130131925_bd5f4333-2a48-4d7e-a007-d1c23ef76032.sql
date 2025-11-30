-- Atualizar horários de trabalho para refletir a regra de negócio:
-- - Primeiro atendimento: 08:30 (tempo para preparação de 08:00-08:30)
-- - Último atendimento calculado dinamicamente baseado na duração do serviço
-- - Fechamento: 20:00

-- Atualizar todos os registros de Segunda a Sábado (dias 1-6)
-- para iniciar às 08:30 e terminar às 20:00
UPDATE working_hours
SET 
  start_time = '08:30:00',
  end_time = '20:00:00'
WHERE day_of_week BETWEEN 1 AND 6;

-- Domingo (dia 0) mantém 09:00-13:00 ou pode ser desativado
-- Vamos verificar se existe e manter o horário especial
UPDATE working_hours
SET 
  start_time = '09:00:00',
  end_time = '13:00:00'
WHERE day_of_week = 0;

-- Adicionar comentário na tabela para documentar a regra
COMMENT ON TABLE working_hours IS 'Horários de trabalho dos barbeiros. O primeiro slot é o start_time e o último slot é calculado como: último horário onde start_time + duração_serviço <= end_time. Ex: end_time=20:00, serviço de 60min = último slot 19:00; serviço de 30min = último slot 19:30.';
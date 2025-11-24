-- Corrigir status padrão de agendamentos
-- O status padrão deve ser 'agendado', não 'confirmado'
-- 'confirmado' só deve ser usado quando o cliente faz check-in no totem

-- 1. Alterar o default da coluna status para 'agendado'
ALTER TABLE painel_agendamentos 
ALTER COLUMN status SET DEFAULT 'agendado';

-- 2. Atualizar agendamentos existentes que estão com 'confirmado' 
-- mas não têm registro de check-in no totem
UPDATE painel_agendamentos 
SET status = 'agendado'
WHERE status = 'confirmado' 
AND id NOT IN (
  SELECT appointment_id 
  FROM totem_sessions 
  WHERE check_in_time IS NOT NULL
);

-- 3. Adicionar comentário explicativo
COMMENT ON COLUMN painel_agendamentos.status IS 'Status do agendamento: agendado (criado), confirmado (check-in feito), concluido (checkout feito), cancelado (cancelado), ausente (não compareceu)';
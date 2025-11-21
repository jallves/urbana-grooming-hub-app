-- Remover a constraint antiga que não considera status cancelado
-- e criar uma nova que permite múltiplos agendamentos no mesmo horário
-- desde que apenas UM não esteja cancelado

-- Primeiro, remover a constraint antiga
ALTER TABLE painel_agendamentos 
DROP CONSTRAINT IF EXISTS painel_agendamentos_barbeiro_id_data_hora_key;

-- Criar índice único parcial que ignora agendamentos cancelados
-- Isso permite ter múltiplos registros no mesmo horário, mas apenas UM ativo
CREATE UNIQUE INDEX painel_agendamentos_barbeiro_data_hora_unique 
ON painel_agendamentos (barbeiro_id, data, hora) 
WHERE status NOT IN ('cancelado', 'CANCELADO');

COMMENT ON INDEX painel_agendamentos_barbeiro_data_hora_unique IS 
'Garante que um barbeiro não tenha dois agendamentos ativos no mesmo horário. Agendamentos cancelados são ignorados, permitindo reagendar o horário.';
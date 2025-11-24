-- Remover constraint antiga que não permite 'ausente'
ALTER TABLE painel_agendamentos 
DROP CONSTRAINT IF EXISTS painel_agendamentos_status_check;

-- Criar nova constraint com todos os status válidos
ALTER TABLE painel_agendamentos
ADD CONSTRAINT painel_agendamentos_status_check 
CHECK (status IN ('agendado', 'confirmado', 'concluido', 'cancelado', 'ausente'));

-- Adicionar comentário explicativo
COMMENT ON CONSTRAINT painel_agendamentos_status_check ON painel_agendamentos IS 
'Status válidos: agendado (criado), confirmado (check-in), concluido (checkout), cancelado (cancelado), ausente (não compareceu)';

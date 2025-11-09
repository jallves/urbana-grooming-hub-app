
-- Limpar vendas duplicadas: manter apenas a mais recente por agendamento
-- Primeiro, identificar e deletar duplicatas mantendo a mais recente
WITH vendas_duplicadas AS (
  SELECT 
    id,
    agendamento_id,
    ROW_NUMBER() OVER (PARTITION BY agendamento_id ORDER BY updated_at DESC) as rn
  FROM vendas
  WHERE status = 'ABERTA' AND agendamento_id IS NOT NULL
)
DELETE FROM vendas
WHERE id IN (
  SELECT id 
  FROM vendas_duplicadas 
  WHERE rn > 1
);

-- Adicionar índice único para evitar duplicatas futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendas_agendamento_aberta 
ON vendas (agendamento_id) 
WHERE status = 'ABERTA';

-- Comentário: Este índice garante que só pode haver 1 venda ABERTA por agendamento
COMMENT ON INDEX idx_vendas_agendamento_aberta IS 'Garante apenas 1 venda ABERTA por agendamento';

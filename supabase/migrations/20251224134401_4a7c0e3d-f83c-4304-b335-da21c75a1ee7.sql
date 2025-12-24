
-- CORREÇÃO: Limpar dados duplicados do checkout b3997d95-0064-4483-b837-1add16d36715

-- 1. Identificar registros financeiros ÚNICOS a manter (os primeiros de cada descrição)
-- e deletar os payment_records dos duplicados primeiro
WITH ranked_transactions AS (
  SELECT 
    id,
    description,
    ROW_NUMBER() OVER (PARTITION BY description ORDER BY created_at ASC) as rn
  FROM financial_records 
  WHERE appointment_id = 'b3997d95-0064-4483-b837-1add16d36715'
),
duplicates AS (
  SELECT id FROM ranked_transactions WHERE rn > 1
)
DELETE FROM payment_records 
WHERE financial_record_id IN (SELECT id FROM duplicates);

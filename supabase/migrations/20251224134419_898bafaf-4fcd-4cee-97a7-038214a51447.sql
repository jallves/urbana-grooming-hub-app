
-- 2. Agora deletar as transações financeiras duplicadas
WITH ranked_transactions AS (
  SELECT 
    id,
    description,
    ROW_NUMBER() OVER (PARTITION BY description ORDER BY created_at ASC) as rn
  FROM financial_records 
  WHERE appointment_id = 'b3997d95-0064-4483-b837-1add16d36715'
)
DELETE FROM financial_records 
WHERE id IN (
  SELECT id FROM ranked_transactions WHERE rn > 1
);


UPDATE public.contas_pagar
SET 
  fornecedor = 'Carlos Firme',
  categoria = 'vale',
  observacoes = COALESCE(observacoes, '') || CASE WHEN observacoes IS NULL OR observacoes = '' THEN '' ELSE ' | ' END || 'Vale do barbeiro Carlos Firme - desconto da comissão',
  updated_at = now()
WHERE id = '4bbbfccd-75bb-42a0-a6ab-2c8346c69f67';

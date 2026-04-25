
-- Correção de auditoria: normalizar nomes e preencher venda_id faltantes

-- 1. Normalizar espaços em barber_name / fornecedor
UPDATE barber_commissions 
SET barber_name = TRIM(barber_name) 
WHERE barber_name IS NOT NULL AND barber_name <> TRIM(barber_name);

UPDATE contas_pagar 
SET fornecedor = TRIM(fornecedor) 
WHERE fornecedor IS NOT NULL AND fornecedor <> TRIM(fornecedor);

UPDATE financial_records 
SET barber_name = TRIM(barber_name) 
WHERE barber_name IS NOT NULL AND barber_name <> TRIM(barber_name);

UPDATE painel_barbeiros 
SET nome = TRIM(nome) 
WHERE nome IS NOT NULL AND nome <> TRIM(nome);

-- 2. Preencher venda_id faltante em contas_pagar (cruzando com barber_commissions)
UPDATE contas_pagar cp
SET venda_id = bc.venda_id, updated_at = now()
FROM barber_commissions bc
WHERE cp.venda_id IS NULL
  AND bc.venda_id IS NOT NULL
  AND TRIM(bc.barber_name) = TRIM(cp.fornecedor)
  AND bc.valor = cp.valor
  AND bc.created_at::date = cp.created_at::date
  AND cp.categoria IN ('comissao','comissao_assinatura','gorjeta','produto');

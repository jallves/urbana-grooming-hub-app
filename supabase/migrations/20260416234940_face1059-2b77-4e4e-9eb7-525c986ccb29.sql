
-- Backfill: preencher venda_id em contas_pagar usando financial_records
-- Match: mesmo barbeiro/fornecedor + mesmo valor + criadas dentro de 60s
UPDATE contas_pagar cp
SET venda_id = fr.reference_id::uuid
FROM financial_records fr
WHERE cp.venda_id IS NULL
  AND fr.transaction_type = 'commission'
  AND fr.reference_id IS NOT NULL
  AND fr.barber_id IS NOT NULL
  AND ABS(EXTRACT(EPOCH FROM (cp.created_at - fr.created_at))) < 60
  AND fr.amount = cp.valor
  AND EXISTS (
    SELECT 1 FROM painel_barbeiros pb
    WHERE pb.id = fr.barber_id
      AND (cp.fornecedor ILIKE '%' || TRIM(pb.nome) || '%' OR TRIM(pb.nome) ILIKE '%' || cp.fornecedor || '%')
  )
  AND EXISTS (
    SELECT 1 FROM painel_agendamentos ag
    WHERE ag.venda_id = fr.reference_id::uuid
  );

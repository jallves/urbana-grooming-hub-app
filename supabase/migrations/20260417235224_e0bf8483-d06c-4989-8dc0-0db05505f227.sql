-- Backfill correto: extrair o id da venda que vem após ";ref=totem_venda;id="
UPDATE contas_receber cr
SET venda_id = sub.venda_uuid::uuid
FROM (
  SELECT id, substring(observacoes from ';ref=totem_venda;id=([0-9a-f-]{36})') as venda_uuid
  FROM contas_receber
  WHERE venda_id IS NULL
    AND observacoes LIKE '%ref=totem_venda%'
) sub
WHERE cr.id = sub.id 
  AND sub.venda_uuid IS NOT NULL
  AND EXISTS (SELECT 1 FROM vendas v WHERE v.id = sub.venda_uuid::uuid);

UPDATE contas_pagar cp
SET venda_id = sub.venda_uuid::uuid
FROM (
  SELECT id, substring(observacoes from ';ref=totem_venda;id=([0-9a-f-]{36})') as venda_uuid
  FROM contas_pagar
  WHERE venda_id IS NULL
    AND observacoes LIKE '%ref=totem_venda%'
) sub
WHERE cp.id = sub.id 
  AND sub.venda_uuid IS NOT NULL
  AND EXISTS (SELECT 1 FROM vendas v WHERE v.id = sub.venda_uuid::uuid);
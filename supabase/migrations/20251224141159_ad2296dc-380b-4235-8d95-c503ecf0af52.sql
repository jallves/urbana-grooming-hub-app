
-- CORREÇÃO 1: Remover itens duplicados de vendas_itens
-- Manter apenas o primeiro registro de cada produto

-- Primeiro, identificar os IDs duplicados da Cera Capilar Matte
DELETE FROM vendas_itens 
WHERE id = '9ce5c5bc-933c-4118-9d26-5f8f081bcc09';

-- CORREÇÃO 2: Inserir o serviço extra que está faltando
INSERT INTO vendas_itens (venda_id, tipo, ref_id, nome, quantidade, preco_unit, total)
VALUES (
  '293ab90b-a919-478e-9700-d47824f63b76',
  'SERVICO_EXTRA',
  '21c08e34-cfe5-443f-8651-b2699046e166',
  'Barba + Sobrancelha',
  1,
  70.00,
  70.00
);

-- CORREÇÃO 3: Recalcular o total da venda
-- Agora deve ser: 140 + 70 + 96 + 110 = 416
UPDATE vendas 
SET 
  subtotal = 416.00,
  total = 416.00 - COALESCE(desconto, 0)
WHERE id = '293ab90b-a919-478e-9700-d47824f63b76';

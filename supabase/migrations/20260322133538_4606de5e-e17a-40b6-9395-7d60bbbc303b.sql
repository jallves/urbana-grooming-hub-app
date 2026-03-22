
-- Fix stuck checkout for João Alves (cdea0c35)
-- The subscription credit was used but checkout never finalized

-- 1. Atualizar a venda para refletir pagamento via assinatura (crédito)
UPDATE vendas 
SET valor_total = 0, 
    forma_pagamento = 'ASSINATURA', 
    status = 'pago', 
    gorjeta = 0,
    observacoes = 'Crédito assinatura Combo corte ou Barba - Crédito 4/4 (corrigido manualmente)'
WHERE id = 'd331e11b-8083-4a50-93ff-73a353cbb32f';

-- 2. Finalizar o agendamento
UPDATE painel_agendamentos 
SET status = 'concluido', 
    status_totem = 'FINALIZADO', 
    updated_at = NOW()
WHERE id = 'cdea0c35-2697-4756-9956-4cf3577b6a15';

-- 3. Atualizar session do totem
UPDATE appointment_totem_sessions 
SET status = 'completed'
WHERE appointment_id = 'cdea0c35-2697-4756-9956-4cf3577b6a15';

-- 4. Criar lançamento no Contas a Receber (R$ 0 - crédito assinatura)
INSERT INTO contas_receber (categoria, cliente_id, data_recebimento, data_vencimento, descricao, forma_pagamento, status, valor)
VALUES ('assinatura', 'e7043efa-9ba6-480e-aad0-a51f8b09f417', '2026-03-22', '2026-03-22', 
        'Uso crédito assinatura: Barba (R$ 0,00 - já pago no combo) - corrigido', 
        'subscription_credit', 'recebido', 0);

-- 5. Criar lançamento de comissão no Contas a Pagar (40% do valor unitário do crédito: R$1/4 = R$0.25 * 40% = R$0.10)
INSERT INTO contas_pagar (categoria, data_vencimento, descricao, fornecedor, status, valor, observacoes)
VALUES ('comissao_assinatura', '2026-03-22', 
        'Comissão 40% de R$ 0.25 - Barba (uso crédito assinatura) - corrigido', 
        'Carlos Firme ', 'pendente', 0.10,
        'Comissão sobre crédito assinatura - corrigido manualmente');

-- 6. Cash flow entries
INSERT INTO cash_flow (transaction_type, amount, description, category, payment_method, transaction_date, reference_id, notes)
VALUES 
('income', 0, 'Uso crédito assinatura: Barba (R$ 0,00)', 'assinatura', 'subscription_credit', '2026-03-22', 'd331e11b-8083-4a50-93ff-73a353cbb32f', 'Crédito assinatura - corrigido'),
('expense', 0.10, 'Comissão Barba (crédito assinatura)', 'comissao_assinatura', 'subscription_credit', '2026-03-22', 'd331e11b-8083-4a50-93ff-73a353cbb32f', 'Comissão 40% sobre R$ 0.25 - corrigido');

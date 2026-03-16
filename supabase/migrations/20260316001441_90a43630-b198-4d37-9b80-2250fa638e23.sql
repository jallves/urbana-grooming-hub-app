
-- 1. Delete appointment ratings for João Alves
DELETE FROM appointment_ratings WHERE client_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417';

-- 2. Delete appointment_totem_sessions for João Alves' appointments
DELETE FROM appointment_totem_sessions WHERE appointment_id IN (
  SELECT id FROM painel_agendamentos WHERE cliente_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417'
);

-- 3. Delete subscription_usage for João Alves' subscriptions
DELETE FROM subscription_usage WHERE subscription_id IN (
  SELECT id FROM client_subscriptions WHERE client_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417'
);

-- 4. Delete subscription_payments for João Alves' subscriptions
DELETE FROM subscription_payments WHERE subscription_id IN (
  SELECT id FROM client_subscriptions WHERE client_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417'
);

-- 5. Delete barber_commissions related to assinatura (tipo = 'assinatura' or 'uso_credito_assinatura')
DELETE FROM barber_commissions WHERE tipo IN ('assinatura', 'uso_credito_assinatura');

-- 6. Delete contas_pagar related to assinatura
DELETE FROM contas_pagar WHERE categoria = 'assinatura' OR (categoria = 'Comissão' AND descricao ILIKE '%Assinatura%');

-- 7. Delete contas_receber for João Alves (assinatura + produto combo)
DELETE FROM contas_receber WHERE cliente_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417';

-- 8. Delete financial_records for João Alves (assinatura + produto combo)
DELETE FROM financial_records WHERE client_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417';

-- 9. Delete client_subscriptions for João Alves (keeps plans intact)
DELETE FROM client_subscriptions WHERE client_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417';

-- 10. Delete vendas linked to João Alves' appointments
DELETE FROM vendas WHERE id IN (
  SELECT venda_id FROM painel_agendamentos WHERE cliente_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417' AND venda_id IS NOT NULL
);

-- 11. Delete all agendamentos for João Alves (cancelados e concluídos)
DELETE FROM painel_agendamentos WHERE cliente_id = 'e7043efa-9ba6-480e-aad0-a51f8b09f417';

-- Desabilitar trigger temporariamente para limpeza completa
ALTER TABLE painel_agendamentos DISABLE TRIGGER prevent_appointment_deletion_trigger;

-- Limpar dados para novos testes (respeitando foreign keys)

-- 1. Limpar payment_records primeiro (referencia financial_records)
DELETE FROM payment_records;

-- 2. Limpar tabelas de avaliações (dependem de agendamentos)
DELETE FROM appointment_ratings;

-- 3. Limpar comissões
DELETE FROM barber_commissions;
DELETE FROM comissoes;
DELETE FROM commission_payments;

-- 4. Limpar lançamentos financeiros
DELETE FROM cash_flow;
DELETE FROM financial_records;
DELETE FROM financial_transactions;
DELETE FROM finance_transactions;

-- 5. Limpar cupons aplicados
DELETE FROM appointment_coupons;

-- 6. Limpar serviços extras de agendamentos
DELETE FROM appointment_extra_services;

-- 7. Limpar histórico de agendamentos
DELETE FROM appointment_history;

-- 8. Limpar logs de notificações
DELETE FROM notification_logs;

-- 9. Limpar vendas (referencia agendamentos)
DELETE FROM vendas;

-- 10. Limpar agendamentos
DELETE FROM painel_agendamentos;
DELETE FROM appointments;

-- 11. Limpar vendas de produtos do totem
DELETE FROM totem_product_sales;

-- 12. Limpar produtos
DELETE FROM painel_produtos;

-- 13. Limpar serviços
DELETE FROM painel_servicos;

-- Reabilitar trigger
ALTER TABLE painel_agendamentos ENABLE TRIGGER prevent_appointment_deletion_trigger;

-- =============================================
-- LIMPEZA DE DADOS PARA PRODUÇÃO
-- Zerando: clientes, produtos, ERP financeiro
-- =============================================

-- 1. Itens de vendas e comissões
DELETE FROM vendas_itens;
DELETE FROM barber_commissions;
DELETE FROM comissoes;
DELETE FROM totem_payments;

-- 2. Sessões e avaliações de agendamentos
DELETE FROM appointment_totem_sessions;
DELETE FROM appointment_ratings;

-- 3. Registros financeiros
DELETE FROM financial_records;
DELETE FROM financial_transactions;
DELETE FROM contas_receber;
DELETE FROM contas_pagar;
DELETE FROM cash_flow;
DELETE FROM cash_register_sessions;

-- 4. Agendamentos e vendas
DELETE FROM painel_agendamentos;
DELETE FROM appointments;
DELETE FROM vendas;

-- 5. Clientes
DELETE FROM client_profiles;
DELETE FROM painel_clientes;
DELETE FROM clients;

-- 6. Produtos
DELETE FROM painel_produtos;

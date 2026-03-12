
-- 1. Deletar todos os agendamentos
DELETE FROM appointment_totem_sessions WHERE appointment_id IN (SELECT id FROM painel_agendamentos);
DELETE FROM appointment_ratings WHERE appointment_id IN (SELECT id FROM painel_agendamentos);
DELETE FROM painel_agendamentos;

-- 2. Deletar registros relacionados ao cliente "Teste cadastro"
DELETE FROM client_profiles WHERE client_id = '64a349d8-fbb8-459d-81cb-8af066a8c2bf';
DELETE FROM contas_receber WHERE cliente_id = '64a349d8-fbb8-459d-81cb-8af066a8c2bf';
DELETE FROM financial_records WHERE client_id = '64a349d8-fbb8-459d-81cb-8af066a8c2bf';
DELETE FROM client_subscriptions WHERE client_id = '64a349d8-fbb8-459d-81cb-8af066a8c2bf';
DELETE FROM painel_clientes WHERE id = '64a349d8-fbb8-459d-81cb-8af066a8c2bf';

-- 3. Deletar produto "Teste Pix"
DELETE FROM painel_produtos WHERE id = '8c26a9bd-bbaf-4689-811b-b9a84d681759';

-- 4. Deletar dados financeiros de hoje
DELETE FROM contas_receber WHERE created_at::date = CURRENT_DATE;
DELETE FROM contas_pagar WHERE created_at::date = CURRENT_DATE;
DELETE FROM financial_records WHERE created_at::date = CURRENT_DATE;
DELETE FROM barber_commissions WHERE created_at::date = CURRENT_DATE;
DELETE FROM vendas WHERE created_at::date = CURRENT_DATE;
DELETE FROM cash_flow WHERE created_at::date = CURRENT_DATE;

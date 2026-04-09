
-- Limpar appointment_totem_sessions do Leonardo
DELETE FROM appointment_totem_sessions WHERE appointment_id = '4482e105-42b2-43bd-8277-bd3eb2738e9f';

-- Limpar venda pendente
DELETE FROM vendas WHERE id = 'f960019a-9b9c-4bbb-a2ba-fefa2ae37e25';

-- Limpar totem session órfã
DELETE FROM totem_sessions WHERE id = '5ae24dce-3e4f-4fdb-80ca-907c6a66e663';

-- Limpar status_totem e venda_id do agendamento cancelado
UPDATE painel_agendamentos 
SET status_totem = NULL, venda_id = NULL, updated_at = NOW()
WHERE id = '4482e105-42b2-43bd-8277-bd3eb2738e9f';

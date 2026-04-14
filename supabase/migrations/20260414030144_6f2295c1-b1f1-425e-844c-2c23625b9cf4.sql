
-- Delete appointment_totem_sessions linked to João Alves' appointment
DELETE FROM appointment_totem_sessions WHERE appointment_id = 'de1bd0e9-b6f9-47ba-8ab7-9551a0dfd485';

-- Delete the pending venda
DELETE FROM vendas WHERE id = '803dc188-5189-4934-a203-ad5862267b92';

-- Delete vendas_itens linked to the venda
DELETE FROM vendas_itens WHERE venda_id = '803dc188-5189-4934-a203-ad5862267b92';

-- Delete the appointment
DELETE FROM painel_agendamentos WHERE id = 'de1bd0e9-b6f9-47ba-8ab7-9551a0dfd485';

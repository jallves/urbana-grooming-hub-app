-- Remove agendamento João Alves 16/05/2026 e dados relacionados
DELETE FROM appointment_totem_sessions WHERE appointment_id = 'b0e85458-9963-465f-bbe4-4960b25d0fde';
DELETE FROM vendas WHERE id = '24c7f076-2b35-4b71-8d18-ed1b55a8863b';
DELETE FROM painel_agendamentos WHERE id = 'b0e85458-9963-465f-bbe4-4960b25d0fde';
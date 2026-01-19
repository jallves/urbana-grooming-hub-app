-- Habilitar Realtime para tabelas críticas do sistema
ALTER PUBLICATION supabase_realtime ADD TABLE painel_agendamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_totem_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE vendas;
ALTER PUBLICATION supabase_realtime ADD TABLE painel_clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE financial_records;
ALTER PUBLICATION supabase_realtime ADD TABLE barber_commissions;
-- Ativar REPLICA IDENTITY FULL para capturar mudanças completas
ALTER TABLE financial_records REPLICA IDENTITY FULL;
ALTER TABLE cash_flow REPLICA IDENTITY FULL;
ALTER TABLE barber_commissions REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE financial_records;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_flow;
ALTER PUBLICATION supabase_realtime ADD TABLE barber_commissions;
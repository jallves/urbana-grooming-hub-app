-- Adicionar FK de appointment_totem_sessions para painel_agendamentos
ALTER TABLE appointment_totem_sessions
ADD CONSTRAINT appointment_totem_sessions_painel_agendamentos_fk
FOREIGN KEY (appointment_id) REFERENCES painel_agendamentos(id) ON DELETE CASCADE;
-- Otimização de Performance: Adicionar índices para queries principais (FINAL)
-- Semana 2: Performance 🟡
-- Remove índices em views e adiciona apenas em tabelas reais

-- 1. Índices para appointments (tabela real)
CREATE INDEX IF NOT EXISTS idx_appointments_staff_date 
ON appointments(staff_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_client_date 
ON appointments(client_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status) 
WHERE status IN ('scheduled', 'confirmed');

-- 2. Índices para vendas e itens
CREATE INDEX IF NOT EXISTS idx_vendas_agendamento 
ON vendas(agendamento_id);

CREATE INDEX IF NOT EXISTS idx_vendas_itens_venda 
ON vendas_itens(venda_id);

CREATE INDEX IF NOT EXISTS idx_vendas_itens_tipo_ref 
ON vendas_itens(tipo, ref_id);

-- 3. Índices para services (tabela real)
CREATE INDEX IF NOT EXISTS idx_services_active 
ON services(is_active, duration) 
WHERE is_active = true;

-- 4. Índices para staff (tabela real)
CREATE INDEX IF NOT EXISTS idx_staff_active_role 
ON staff(is_active, role) 
WHERE is_active = true;

-- 5. Índices para sessões do totem
CREATE INDEX IF NOT EXISTS idx_totem_sessions_appointment 
ON totem_sessions(appointment_id);

CREATE INDEX IF NOT EXISTS idx_totem_sessions_active 
ON totem_sessions(status, created_at DESC) 
WHERE status IN ('AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO');

-- 6. Índices para payments
CREATE INDEX IF NOT EXISTS idx_totem_payments_session 
ON totem_payments(session_id);

-- 7. Índices para comissões
CREATE INDEX IF NOT EXISTS idx_barber_commissions_barber_status 
ON barber_commissions(barber_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comissoes_barbeiro_status 
ON comissoes(barbeiro_id, status, data DESC);

-- 8. Índices para transações financeiras
CREATE INDEX IF NOT EXISTS idx_finance_transactions_barbeiro_data 
ON finance_transactions(barbeiro_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_agendamento 
ON finance_transactions(agendamento_id);

-- 9. Índices para clients (tabela real)
CREATE INDEX IF NOT EXISTS idx_clients_email 
ON clients(email) 
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_phone 
ON clients(phone);

-- 10. Índice para working_hours
CREATE INDEX IF NOT EXISTS idx_working_hours_staff_day 
ON working_hours(staff_id, day_of_week) 
WHERE is_active = true;

-- 11. Índice para banner_images
CREATE INDEX IF NOT EXISTS idx_banner_images_active_order 
ON banner_images(is_active, display_order) 
WHERE is_active = true;

-- 12. Índices para financial_records
CREATE INDEX IF NOT EXISTS idx_financial_records_date_type 
ON financial_records(transaction_date DESC, transaction_type);

CREATE INDEX IF NOT EXISTS idx_financial_records_barber 
ON financial_records(barber_id, transaction_date DESC);

-- Comentários
COMMENT ON INDEX idx_appointments_staff_date IS 'Otimiza consultas de agendamentos por staff e data';
COMMENT ON INDEX idx_appointments_status IS 'Otimiza filtros por status ativos';
COMMENT ON INDEX idx_totem_sessions_active IS 'Otimiza busca de sessões ativas no totem';
COMMENT ON INDEX idx_barber_commissions_barber_status IS 'Otimiza consultas de comissões por barbeiro';
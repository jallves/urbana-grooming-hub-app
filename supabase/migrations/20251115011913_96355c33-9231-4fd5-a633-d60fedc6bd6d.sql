-- Create optimized view for barber commissions with all related data
CREATE OR REPLACE VIEW vw_barber_commissions_complete AS
SELECT 
  bc.id,
  bc.barber_id,
  bc.appointment_id,
  bc.amount,
  bc.commission_rate,
  bc.status,
  bc.created_at,
  bc.payment_date,
  bc.appointment_source,
  -- Appointment date and time
  CASE 
    WHEN bc.appointment_source = 'painel' THEN pa.data::text
    ELSE ap.start_time::date::text
  END as appointment_date,
  CASE 
    WHEN bc.appointment_source = 'painel' THEN pa.hora::text
    ELSE to_char(ap.start_time, 'HH24:MI')
  END as appointment_time,
  CASE 
    WHEN bc.appointment_source = 'painel' THEN pc.nome
    ELSE cl.name
  END as client_name,
  CASE 
    WHEN bc.appointment_source = 'painel' THEN ps.nome
    ELSE sv.name
  END as service_name,
  CASE 
    WHEN bc.appointment_source = 'painel' THEN ps.preco
    ELSE sv.price
  END as service_price
FROM barber_commissions bc
LEFT JOIN painel_agendamentos pa ON bc.appointment_id = pa.id AND bc.appointment_source = 'painel'
LEFT JOIN painel_clientes pc ON pa.cliente_id = pc.id
LEFT JOIN painel_servicos ps ON pa.servico_id = ps.id
LEFT JOIN appointments ap ON bc.appointment_id = ap.id AND bc.appointment_source = 'appointments'
LEFT JOIN clients cl ON ap.client_id = cl.id
LEFT JOIN services sv ON ap.service_id = sv.id;

-- Grant access to authenticated users
GRANT SELECT ON vw_barber_commissions_complete TO authenticated;

-- Create indexes on barber_commissions for better performance
CREATE INDEX IF NOT EXISTS idx_barber_commissions_barber_date 
ON barber_commissions(barber_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_barber_commissions_status 
ON barber_commissions(barber_id, status);

-- Create indexes on related tables for JOIN performance
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_id 
ON painel_agendamentos(id);

CREATE INDEX IF NOT EXISTS idx_appointments_id 
ON appointments(id);
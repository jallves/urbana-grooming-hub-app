-- =====================================================
-- CORRIGIR VIEWS COM SECURITY DEFINER -> SECURITY INVOKER
-- Views devem respeitar RLS do usuário que consulta
-- =====================================================

-- 1. COMMISSION_REPORT
DROP VIEW IF EXISTS public.commission_report;

CREATE VIEW public.commission_report
WITH (security_invoker = true)
AS
SELECT 
    fr.barber_id,
    s.name AS barber_name,
    s.email AS barber_email,
    date_trunc('month'::text, fr.transaction_date::timestamp with time zone) AS period,
    count(fr.id) AS total_services,
    sum(fr.net_amount) AS total_commission,
    avg(s.commission_rate) AS average_rate,
    fr.status
FROM financial_records fr
JOIN staff s ON fr.barber_id = s.id
WHERE fr.transaction_type = 'commission'::transaction_type
GROUP BY fr.barber_id, s.name, s.email, (date_trunc('month'::text, fr.transaction_date::timestamp with time zone)), fr.status;

-- 2. FINANCIAL_DASHBOARD
DROP VIEW IF EXISTS public.financial_dashboard;

CREATE VIEW public.financial_dashboard
WITH (security_invoker = true)
AS
SELECT 
    date_trunc('month'::text, financial_records.transaction_date::timestamp with time zone) AS period,
    financial_records.transaction_type,
    financial_records.category,
    sum(financial_records.net_amount) AS total_amount,
    count(*) AS transaction_count,
    avg(financial_records.net_amount) AS average_amount
FROM financial_records
WHERE financial_records.status = 'completed'::transaction_status
GROUP BY (date_trunc('month'::text, financial_records.transaction_date::timestamp with time zone)), financial_records.transaction_type, financial_records.category;

-- 3. PAINEL_CLIENTES (já foi corrigida antes, mas vamos garantir SECURITY INVOKER)
DROP VIEW IF EXISTS public.painel_clientes;

CREATE VIEW public.painel_clientes
WITH (security_invoker = true)
AS
SELECT 
    cp.id,
    cp.nome,
    cp.email,
    cp.whatsapp,
    cp.data_nascimento,
    cp.created_at,
    cp.updated_at
FROM client_profiles cp;

COMMENT ON VIEW public.painel_clientes IS 'View de clientes do painel com SECURITY INVOKER para respeitar RLS.';

-- 4. VW_AGENDAMENTOS_SEM_FINANCEIRO
DROP VIEW IF EXISTS public.vw_agendamentos_sem_financeiro;

CREATE VIEW public.vw_agendamentos_sem_financeiro
WITH (security_invoker = true)
AS
SELECT 
    pa.id AS agendamento_id,
    pa.data AS agendamento_data,
    pa.hora AS agendamento_hora,
    pa.status,
    pa.status_totem,
    pa.updated_at,
    pa.cliente_id,
    pa.barbeiro_id,
    pc.nome AS cliente_nome,
    pb.nome AS barbeiro_nome,
    v.id AS venda_id,
    v.total AS venda_total,
    count(fr.id) AS registros_financeiros_count,
    EXTRACT(epoch FROM now() - pa.updated_at) / 60::numeric AS minutos_desde_finalizacao
FROM painel_agendamentos pa
LEFT JOIN painel_clientes_legacy pc ON pa.cliente_id = pc.id
LEFT JOIN painel_barbeiros pb ON pa.barbeiro_id = pb.id
LEFT JOIN vendas v ON v.agendamento_id = pa.id
LEFT JOIN financial_records fr ON fr.appointment_id = pa.id
WHERE (pa.status = ANY (ARRAY['concluido'::text, 'FINALIZADO'::text])) 
  AND pa.status_totem = 'FINALIZADO'::status_agendamento
GROUP BY pa.id, pa.data, pa.hora, pa.status, pa.status_totem, pa.updated_at, pa.cliente_id, pa.barbeiro_id, pc.nome, pb.nome, v.id, v.total
HAVING count(fr.id) = 0 AND (EXTRACT(epoch FROM now() - pa.updated_at) / 60::numeric) > 2::numeric;

-- 5. VW_BARBER_COMMISSIONS_COMPLETE
DROP VIEW IF EXISTS public.vw_barber_commissions_complete;

CREATE VIEW public.vw_barber_commissions_complete
WITH (security_invoker = true)
AS
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
    CASE
        WHEN bc.appointment_source = 'painel'::text THEN pa.data::text
        ELSE ap.start_time::date::text
    END AS appointment_date,
    CASE
        WHEN bc.appointment_source = 'painel'::text THEN pa.hora::text
        ELSE to_char(ap.start_time, 'HH24:MI'::text)
    END AS appointment_time,
    CASE
        WHEN bc.appointment_source = 'painel'::text THEN pc.nome
        ELSE cl.name
    END AS client_name,
    CASE
        WHEN bc.appointment_source = 'painel'::text THEN ps.nome
        ELSE sv.name
    END AS service_name,
    CASE
        WHEN bc.appointment_source = 'painel'::text THEN ps.preco
        ELSE sv.price
    END AS service_price
FROM barber_commissions bc
LEFT JOIN painel_agendamentos pa ON bc.appointment_id = pa.id AND bc.appointment_source = 'painel'::text
LEFT JOIN painel_clientes_legacy pc ON pa.cliente_id = pc.id
LEFT JOIN painel_servicos ps ON pa.servico_id = ps.id
LEFT JOIN appointments ap ON bc.appointment_id = ap.id AND bc.appointment_source = 'appointments'::text
LEFT JOIN clients cl ON ap.client_id = cl.id
LEFT JOIN services sv ON ap.service_id = sv.id;

-- 6. VW_VENDAS_ABERTAS
DROP VIEW IF EXISTS public.vw_vendas_abertas;

CREATE VIEW public.vw_vendas_abertas
WITH (security_invoker = true)
AS
SELECT 
    v.id AS venda_id,
    v.cliente_id,
    pc.nome AS cliente_nome,
    pc.whatsapp AS cliente_whatsapp,
    v.agendamento_id,
    v.totem_session_id,
    v.total,
    v.updated_at,
    ts.status AS sessao_status,
    ts.check_in_time,
    CASE
        WHEN v.agendamento_id IS NULL THEN 'PRODUTO_DIRETO'::text
        ELSE 'SERVICO'::text
    END AS tipo_venda,
    EXTRACT(epoch FROM now() - v.updated_at) / 3600::numeric AS horas_aberta
FROM vendas v
LEFT JOIN painel_clientes_legacy pc ON v.cliente_id = pc.id
LEFT JOIN totem_sessions ts ON v.totem_session_id = ts.id
WHERE v.status = 'ABERTA'::text
ORDER BY v.updated_at DESC;
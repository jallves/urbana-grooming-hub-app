
-- =====================================================
-- RECRIAR APENAS AS VIEWS DE RELATÓRIO COM SECURITY INVOKER
-- =====================================================

-- View: vw_agendamentos_sem_financeiro
DROP VIEW IF EXISTS vw_agendamentos_sem_financeiro CASCADE;

CREATE VIEW vw_agendamentos_sem_financeiro WITH (security_invoker = true) AS
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
  COUNT(fr.id) AS registros_financeiros_count,
  (EXTRACT(epoch FROM (now() - pa.updated_at)) / 60) AS minutos_desde_finalizacao
FROM painel_agendamentos pa
LEFT JOIN painel_clientes pc ON pa.cliente_id = pc.id
LEFT JOIN painel_barbeiros pb ON pa.barbeiro_id = pb.id
LEFT JOIN vendas v ON v.agendamento_id = pa.id
LEFT JOIN financial_records fr ON fr.appointment_id = pa.id
WHERE pa.status IN ('concluido', 'FINALIZADO')
  AND pa.status_totem = 'FINALIZADO'
GROUP BY pa.id, pa.data, pa.hora, pa.status, pa.status_totem, 
         pa.updated_at, pa.cliente_id, pa.barbeiro_id, 
         pc.nome, pb.nome, v.id, v.total
HAVING COUNT(fr.id) = 0 
  AND (EXTRACT(epoch FROM (now() - pa.updated_at)) / 60) > 2;

-- View: vw_vendas_abertas
DROP VIEW IF EXISTS vw_vendas_abertas CASCADE;

CREATE VIEW vw_vendas_abertas WITH (security_invoker = true) AS
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
    WHEN v.agendamento_id IS NULL THEN 'PRODUTO_DIRETO'
    ELSE 'SERVICO'
  END AS tipo_venda,
  (EXTRACT(epoch FROM (now() - v.updated_at)) / 3600) AS horas_aberta
FROM vendas v
LEFT JOIN painel_clientes pc ON v.cliente_id = pc.id
LEFT JOIN totem_sessions ts ON v.totem_session_id = ts.id
WHERE v.status = 'ABERTA'
ORDER BY v.updated_at DESC;

GRANT SELECT ON vw_agendamentos_sem_financeiro TO authenticated, anon;
GRANT SELECT ON vw_vendas_abertas TO authenticated, anon;

COMMENT ON VIEW vw_agendamentos_sem_financeiro IS 
'View de agendamentos sem registros financeiros - usa SECURITY INVOKER para aplicar permissões do usuário';

COMMENT ON VIEW vw_vendas_abertas IS 
'View de vendas abertas - usa SECURITY INVOKER para aplicar permissões do usuário';

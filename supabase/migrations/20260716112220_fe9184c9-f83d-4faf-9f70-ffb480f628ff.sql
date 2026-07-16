
-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_entity_id uuid;
  v_admin_id uuid;
  v_old jsonb;
  v_new jsonb;
BEGIN
  -- Ação em minúsculo (insert/update/delete)
  v_action := lower(TG_OP);

  -- Extrai id (todas as tabelas auditadas têm id uuid)
  IF TG_OP = 'DELETE' THEN
    v_entity_id := (row_to_json(OLD)::jsonb ->> 'id')::uuid;
    v_old := to_jsonb(OLD);
    v_new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_entity_id := (row_to_json(NEW)::jsonb ->> 'id')::uuid;
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSE
    v_entity_id := (row_to_json(NEW)::jsonb ->> 'id')::uuid;
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- pula updates sem mudança real
    IF v_old = v_new THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Tenta associar a um admin (opcional)
  BEGIN
    SELECT id INTO v_admin_id
    FROM public.admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_admin_id := NULL;
  END;

  INSERT INTO public.admin_activity_log (
    admin_id, action, entity_type, entity_id, old_data, new_data
  ) VALUES (
    v_admin_id, v_action, TG_TABLE_NAME, v_entity_id, v_old, v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Anexa trigger nas tabelas críticas
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'painel_agendamentos','painel_clientes','painel_barbeiros','painel_produtos',
    'painel_servicos','financial_records','contas_pagar','contas_receber',
    'vendas','vendas_itens','employees','staff','admin_users','user_roles',
    'subscription_plans','client_subscriptions','discount_coupons',
    'cash_register_sessions','working_hours','barber_availability','time_off',
    'banner_images','gallery_images','staff_module_access','settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.audit_table_change()',
      t, t
    );
  END LOOP;
END $$;

-- 4. RPC de estatísticas mensais de login
CREATE OR REPLACE FUNCTION public.get_monthly_login_stats()
RETURNS TABLE (
  user_type text,
  unique_users bigint,
  total_logins bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(new_data->>'user_type', 'unknown') AS user_type,
    COUNT(DISTINCT COALESCE(new_data->>'user_email', entity_id::text)) AS unique_users,
    COUNT(*) AS total_logins
  FROM public.admin_activity_log
  WHERE action = 'login'
    AND created_at >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
  GROUP BY 1
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_monthly_login_stats() TO authenticated;

-- 5. RPC para encerrar sessões em lock (>30 min sem atividade)
CREATE OR REPLACE FUNCTION public.cleanup_locked_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.active_sessions
  SET is_active = false
  WHERE is_active = true
    AND last_activity_at < (now() - interval '30 minutes');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_locked_sessions() TO authenticated;

-- 6. Função de retenção 30 dias
CREATE OR REPLACE FUNCTION public.retention_cleanup_30_days()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_activity_log
  WHERE created_at < (now() - interval '30 days');

  DELETE FROM public.active_sessions
  WHERE (is_active = false OR expires_at < now())
    AND COALESCE(last_activity_at, login_at) < (now() - interval '30 days');
END;
$$;

-- 7. Cron jobs
-- Remove agendamento anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('retention-cleanup-30-days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'retention-cleanup-30-days',
  '0 3 * * *',
  $$SELECT public.retention_cleanup_30_days();$$
);

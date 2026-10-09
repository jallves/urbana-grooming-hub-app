
-- 1) Novas colunas
ALTER TABLE public.client_subscriptions
  ADD COLUMN IF NOT EXISTS expires_at date,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'balcao',
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text;
CREATE UNIQUE INDEX IF NOT EXISTS client_subscriptions_stripe_session_uidx
  ON public.client_subscriptions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- 2) Converter planos e assinaturas para anual (365 dias)
UPDATE public.subscription_plans SET billing_period = 'annual';
UPDATE public.client_subscriptions
   SET expires_at = start_date + 365, end_date = start_date + 365, next_billing_date = NULL
 WHERE expires_at IS NULL;

-- 3) Regras ao criar/ativar assinatura: validade 365d e renovação só sem saldo
CREATE OR REPLACE FUNCTION public.enforce_subscription_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.start_date + 365;
  END IF;
  NEW.end_date := NEW.expires_at;
  NEW.next_billing_date := NULL;

  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    IF EXISTS (
      SELECT 1 FROM public.client_subscriptions s
       WHERE s.client_id = NEW.client_id AND s.id <> NEW.id
         AND s.status = 'active'
         AND s.credits_used < s.credits_total
         AND COALESCE(s.expires_at, s.start_date + 365) >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
    ) THEN
      RAISE EXCEPTION 'Cliente ainda possui créditos ativos. A renovação só é permitida após usar todos os créditos.'
        USING ERRCODE = 'P0001';
    END IF;
    -- encerra assinaturas antigas já esgotadas/expiradas
    UPDATE public.client_subscriptions SET status = 'completed'
     WHERE client_id = NEW.client_id AND id <> NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_subscription_rules ON public.client_subscriptions;
CREATE TRIGGER trg_enforce_subscription_rules
  BEFORE INSERT OR UPDATE ON public.client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_rules();

-- 4) Consumo de créditos no servidor (titular, saldo, validade, cobertura)
CREATE OR REPLACE FUNCTION public.consume_subscription_credits(p_appointment_id uuid, p_service_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE
  v_client uuid; v_sub record; v_cost int := 0; v_sid uuid; v_unit int; v_comp int;
  v_names text[] := '{}'; v_name text; v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT cliente_id INTO v_client FROM painel_agendamentos WHERE id = p_appointment_id;
  IF v_client IS NULL THEN RAISE EXCEPTION 'Agendamento não encontrado'; END IF;

  -- quem pode chamar: o próprio titular, equipe/admin ou terminal do totem
  IF NOT (
    private.is_totem_request()
    OR is_admin_or_higher(auth.uid())
    OR is_barber_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM painel_barbeiros b WHERE b.id = (SELECT barbeiro_id FROM painel_agendamentos WHERE id = p_appointment_id) AND b.email = (auth.jwt()->>'email'))
    OR EXISTS (SELECT 1 FROM painel_clientes c WHERE c.id = v_client AND c.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF EXISTS (SELECT 1 FROM subscription_usage WHERE appointment_id = p_appointment_id) THEN
    RETURN jsonb_build_object('success', true, 'already_consumed', true);
  END IF;

  -- assinatura do PRÓPRIO cliente do agendamento (intransferível)
  SELECT * INTO v_sub FROM client_subscriptions
   WHERE client_id = v_client AND status = 'active'
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não possui plano ativo'; END IF;
  IF COALESCE(v_sub.expires_at, v_sub.start_date + 365) < v_today THEN
    UPDATE client_subscriptions SET status = 'expired' WHERE id = v_sub.id;
    RAISE EXCEPTION 'Plano vencido';
  END IF;

  FOREACH v_sid IN ARRAY p_service_ids LOOP
    SELECT credits_cost INTO v_unit FROM subscription_plan_services WHERE plan_id = v_sub.plan_id AND service_id = v_sid;
    IF v_unit IS NULL THEN
      -- serviço combo (ex.: Corte e Barba): soma os componentes cobertos
      SELECT COALESCE(sum(ps.credits_cost),0), count(*) INTO v_unit, v_comp
        FROM combo_service_items ci
        JOIN subscription_plan_services ps ON ps.service_id = ci.component_service_id AND ps.plan_id = v_sub.plan_id
       WHERE ci.combo_service_id = v_sid;
      IF v_comp = 0 OR v_comp <> (SELECT count(*) FROM combo_service_items WHERE combo_service_id = v_sid) THEN
        RAISE EXCEPTION 'Serviço não coberto pelo plano';
      END IF;
    END IF;
    SELECT nome INTO v_name FROM painel_servicos WHERE id = v_sid;
    FOR i IN 1..v_unit LOOP v_names := v_names || COALESCE(v_name,'Serviço'); END LOOP;
    v_cost := v_cost + v_unit;
  END LOOP;

  IF v_cost <= 0 THEN RAISE EXCEPTION 'Nenhum serviço informado'; END IF;
  IF v_sub.credits_total - v_sub.credits_used < v_cost THEN
    RAISE EXCEPTION 'Créditos insuficientes (necessário %, disponível %)', v_cost, v_sub.credits_total - v_sub.credits_used;
  END IF;

  INSERT INTO subscription_usage(subscription_id, appointment_id, service_name)
  SELECT v_sub.id, p_appointment_id, unnest(v_names);
  UPDATE client_subscriptions SET credits_used = credits_used + v_cost WHERE id = v_sub.id;

  RETURN jsonb_build_object('success', true, 'credits_consumed', v_cost,
    'credits_remaining', v_sub.credits_total - v_sub.credits_used - v_cost, 'subscription_id', v_sub.id);
END $$;
REVOKE ALL ON FUNCTION public.consume_subscription_credits(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_subscription_credits(uuid, uuid[]) TO anon, authenticated, service_role;

-- 5) Fim de escrita direta nos créditos pelo totem
DROP POLICY IF EXISTS "Totem can update subscription credits" ON public.client_subscriptions;
DROP POLICY IF EXISTS "Totem can manage subscription_usage" ON public.subscription_usage;
CREATE POLICY "Totem can read subscription_usage" ON public.subscription_usage
  FOR SELECT TO anon, authenticated USING (private.is_totem_request());

-- 6) Expiração diária
CREATE OR REPLACE FUNCTION public.expire_client_subscriptions()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH u AS (UPDATE client_subscriptions SET status='expired'
              WHERE status='active' AND expires_at < (now() AT TIME ZONE 'America/Sao_Paulo')::date RETURNING 1)
  SELECT count(*)::int FROM u;
$$;
REVOKE ALL ON FUNCTION public.expire_client_subscriptions() FROM public, anon, authenticated;
SELECT cron.schedule('expire-client-subscriptions', '10 3 * * *', 'SELECT public.expire_client_subscriptions()');

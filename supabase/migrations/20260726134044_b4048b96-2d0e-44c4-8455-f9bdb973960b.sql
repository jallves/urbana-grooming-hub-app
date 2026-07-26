
-- Adiciona colunas de contexto para roteamento de notificações push
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('cliente','barbeiro','admin')),
  ADD COLUMN IF NOT EXISTS staff_id uuid,
  ADD COLUMN IF NOT EXISTS barbeiro_id uuid,
  ADD COLUMN IF NOT EXISTS cliente_id uuid,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0;

-- Deduplica por endpoint (uma inscrição por device)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='push_subscriptions_endpoint_key'
  ) THEN
    CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions(endpoint);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS push_subscriptions_role_idx ON public.push_subscriptions(role) WHERE active = true;
CREATE INDEX IF NOT EXISTS push_subscriptions_cliente_id_idx ON public.push_subscriptions(cliente_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS push_subscriptions_barbeiro_id_idx ON public.push_subscriptions(barbeiro_id) WHERE active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.push_subscriptions_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.push_subscriptions_touch_updated_at();

-- Grants (mantendo padrão)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
-- anon precisa inserir push do cliente/totem quando ainda não autenticou via supabase auth
GRANT INSERT ON public.push_subscriptions TO anon;

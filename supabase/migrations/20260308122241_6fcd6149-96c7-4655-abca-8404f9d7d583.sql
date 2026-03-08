
-- Planos de assinatura
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- ex: Básico, Intermediário, Premium
  slug text NOT NULL UNIQUE, -- basico, intermediario, premium
  description text,
  price numeric NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  color text, -- cor do badge/card
  icon text, -- nome do ícone lucide
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription_plans"
ON public.subscription_plans FOR ALL TO authenticated
USING (is_admin_or_higher(auth.uid()));

CREATE POLICY "Public can read active subscription_plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- Serviços vinculados a cada plano
CREATE TABLE public.subscription_plan_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES painel_servicos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, service_id)
);

ALTER TABLE public.subscription_plan_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription_plan_services"
ON public.subscription_plan_services FOR ALL TO authenticated
USING (is_admin_or_higher(auth.uid()));

CREATE POLICY "Public can read subscription_plan_services"
ON public.subscription_plan_services FOR SELECT
USING (true);

-- Assinaturas dos clientes
CREATE TABLE public.client_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES painel_clientes(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active', -- active, cancelled, expired, paused
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date, -- null = ongoing
  next_billing_date date,
  payment_method text, -- credit_card, pix, cash, etc.
  notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client_subscriptions"
ON public.client_subscriptions FOR ALL TO authenticated
USING (is_admin_or_higher(auth.uid()));

CREATE POLICY "Clients can view own subscriptions"
ON public.client_subscriptions FOR SELECT TO authenticated
USING (client_id IN (
  SELECT id FROM painel_clientes WHERE user_id = auth.uid()
));

-- Histórico de pagamentos de assinatura
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'paid', -- paid, pending, failed
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription_payments"
ON public.subscription_payments FOR ALL TO authenticated
USING (is_admin_or_higher(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_subscriptions_updated_at
  BEFORE UPDATE ON client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Add credits tracking to client_subscriptions
ALTER TABLE public.client_subscriptions 
ADD COLUMN IF NOT EXISTS credits_total integer NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS credits_used integer NOT NULL DEFAULT 0;

-- Create subscription_usage table to track individual credit usage
CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.painel_agendamentos(id) ON DELETE SET NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  service_name text,
  notes text
);

-- Enable RLS
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS: Public can read (totem needs this), admins can manage
CREATE POLICY "Public can read subscription_usage" ON public.subscription_usage
  FOR SELECT TO public USING (true);

CREATE POLICY "Public can insert subscription_usage" ON public.subscription_usage
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can manage subscription_usage" ON public.subscription_usage
  FOR ALL TO authenticated USING (is_admin_or_higher(auth.uid()));

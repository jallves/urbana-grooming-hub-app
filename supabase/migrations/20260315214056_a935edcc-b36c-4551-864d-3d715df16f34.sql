-- Allow public/anon to read client_subscriptions so the Totem can check subscription credits
CREATE POLICY "Public can read client_subscriptions for totem"
ON public.client_subscriptions
FOR SELECT
TO public
USING (true);

-- Also allow public read on subscription_plans (needed to get plan name/price)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Public can read active subscription plans'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can read active subscription plans" ON public.subscription_plans FOR SELECT TO public USING (is_active = true)';
  END IF;
END $$;
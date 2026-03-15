-- Allow public INSERT on subscription_usage (Totem needs to register credit usage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_usage' 
    AND policyname = 'Public can insert subscription_usage for totem'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can insert subscription_usage for totem" ON public.subscription_usage FOR INSERT TO public WITH CHECK (true)';
  END IF;
END $$;

-- Allow public UPDATE on client_subscriptions (Totem needs to increment credits_used)
CREATE POLICY "Public can update credits_used for totem"
ON public.client_subscriptions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
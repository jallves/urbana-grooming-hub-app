DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_subscriptions;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_object_definition THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_payments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_object_definition THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_usage;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_object_definition THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_plans;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_object_definition THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_plan_services;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_object_definition THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_object_definition THEN NULL;
  END;
END $$;
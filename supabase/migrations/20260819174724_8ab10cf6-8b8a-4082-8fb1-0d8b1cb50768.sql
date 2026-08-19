-- ============================================================
-- 1. PRIVATE SCHEMA + TOTEM SESSION GATE
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- Validates the x-totem-token request header against a live totem session.
CREATE OR REPLACE FUNCTION private.is_totem_request()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.totem_sessions ts
    WHERE ts.is_valid = true
      AND ts.expires_at > now()
      AND ts.token = nullif(
            current_setting('request.headers', true), ''
          )::json ->> 'x-totem-token'
  );
$$;

REVOKE ALL ON FUNCTION private.is_totem_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_totem_request() TO anon, authenticated, service_role;

-- Helper: is the caller an authenticated client owning this painel_clientes row?
CREATE OR REPLACE FUNCTION private.owns_client(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.painel_clientes pc
    WHERE pc.id = _client_id AND pc.user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION private.owns_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.owns_client(uuid) TO anon, authenticated, service_role;

-- Helper: is the caller the barber on this row?
CREATE OR REPLACE FUNCTION private.is_this_barber(_barber_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.painel_barbeiros pb
    WHERE pb.id = _barber_id AND pb.staff_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION private.is_this_barber(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_this_barber(uuid) TO anon, authenticated, service_role;

-- ============================================================
-- 2. totem_auth  -> server-side only (PIN hashes no longer public)
-- ============================================================
DROP POLICY IF EXISTS "Public can read totem auth" ON public.totem_auth;
REVOKE ALL ON public.totem_auth FROM anon, authenticated;
GRANT ALL ON public.totem_auth TO service_role;

CREATE POLICY "Admins can manage totem auth"
  ON public.totem_auth FOR ALL TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.totem_auth TO authenticated;

-- ============================================================
-- 3. totem_sessions -> service role only
-- ============================================================
DROP POLICY IF EXISTS "Public can manage totem sessions" ON public.totem_sessions;
REVOKE ALL ON public.totem_sessions FROM anon, authenticated;
GRANT ALL ON public.totem_sessions TO service_role;

-- ============================================================
-- 4. appointment_totem_sessions -> totem token or admin
-- ============================================================
DROP POLICY IF EXISTS "Public can manage appointment_totem_sessions" ON public.appointment_totem_sessions;

CREATE POLICY "Totem can manage appointment_totem_sessions"
  ON public.appointment_totem_sessions FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Admins can manage appointment_totem_sessions"
  ON public.appointment_totem_sessions FOR ALL TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_totem_sessions TO anon, authenticated;
GRANT ALL ON public.appointment_totem_sessions TO service_role;

-- ============================================================
-- 5. totem_payments -> totem token or admin
-- ============================================================
DROP POLICY IF EXISTS "Public can manage totem payments" ON public.totem_payments;

CREATE POLICY "Totem can manage totem payments"
  ON public.totem_payments FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Admins can manage totem payments"
  ON public.totem_payments FOR ALL TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.totem_payments TO anon, authenticated;
GRANT ALL ON public.totem_payments TO service_role;

-- ============================================================
-- 6. vendas -> no more public read/insert
-- ============================================================
DROP POLICY IF EXISTS "Public can read sales" ON public.vendas;
DROP POLICY IF EXISTS "Public can create sales (totem)" ON public.vendas;

CREATE POLICY "Totem can manage sales"
  ON public.vendas FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Clients can view own sales"
  ON public.vendas FOR SELECT TO authenticated
  USING (private.owns_client(cliente_id));

CREATE POLICY "Barbers can view own sales"
  ON public.vendas FOR SELECT TO authenticated
  USING (private.is_this_barber(barbeiro_id) OR public.is_barber_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO anon, authenticated;
GRANT ALL ON public.vendas TO service_role;

-- ============================================================
-- 7. vendas_itens -> no more public read/insert
-- ============================================================
DROP POLICY IF EXISTS "Public can read sales items" ON public.vendas_itens;
DROP POLICY IF EXISTS "Public can create sales items (totem)" ON public.vendas_itens;

CREATE POLICY "Totem can manage sales items"
  ON public.vendas_itens FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Clients can view own sale items"
  ON public.vendas_itens FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vendas v
    WHERE v.id = vendas_itens.venda_id AND private.owns_client(v.cliente_id)
  ));

CREATE POLICY "Barbers can view own sale items"
  ON public.vendas_itens FOR SELECT TO authenticated
  USING (private.is_this_barber(barbeiro_id) OR public.is_barber_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas_itens TO anon, authenticated;
GRANT ALL ON public.vendas_itens TO service_role;

-- ============================================================
-- 8. painel_agendamentos -> no more public read/insert
-- ============================================================
DROP POLICY IF EXISTS "Public can read appointments" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Public can create appointments" ON public.painel_agendamentos;

CREATE POLICY "Totem can manage appointments"
  ON public.painel_agendamentos FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Clients can view own appointments"
  ON public.painel_agendamentos FOR SELECT TO authenticated
  USING (private.owns_client(cliente_id));

CREATE POLICY "Clients can create own appointments"
  ON public.painel_agendamentos FOR INSERT TO authenticated
  WITH CHECK (private.owns_client(cliente_id));

CREATE POLICY "Clients can update own appointments"
  ON public.painel_agendamentos FOR UPDATE TO authenticated
  USING (private.owns_client(cliente_id))
  WITH CHECK (private.owns_client(cliente_id));

CREATE POLICY "Barbers can view own appointments"
  ON public.painel_agendamentos FOR SELECT TO authenticated
  USING (private.is_this_barber(barbeiro_id) OR public.is_barber_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.painel_agendamentos TO anon, authenticated;
GRANT ALL ON public.painel_agendamentos TO service_role;

-- ============================================================
-- 9. client_subscriptions -> no more public read/update
-- ============================================================
DROP POLICY IF EXISTS "Public can read client_subscriptions for totem" ON public.client_subscriptions;
DROP POLICY IF EXISTS "Public can update credits_used for totem" ON public.client_subscriptions;

CREATE POLICY "Totem can read subscriptions"
  ON public.client_subscriptions FOR SELECT TO anon, authenticated
  USING (private.is_totem_request());

CREATE POLICY "Totem can update subscription credits"
  ON public.client_subscriptions FOR UPDATE TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_subscriptions TO authenticated;
GRANT SELECT, UPDATE ON public.client_subscriptions TO anon;
GRANT ALL ON public.client_subscriptions TO service_role;

-- ============================================================
-- 10. subscription_usage -> no more public read/insert
-- ============================================================
DROP POLICY IF EXISTS "Public can read subscription_usage" ON public.subscription_usage;
DROP POLICY IF EXISTS "Public can insert subscription_usage" ON public.subscription_usage;
DROP POLICY IF EXISTS "Public can insert subscription_usage for totem" ON public.subscription_usage;

CREATE POLICY "Totem can manage subscription_usage"
  ON public.subscription_usage FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Clients can view own subscription_usage"
  ON public.subscription_usage FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.client_subscriptions cs
    WHERE cs.id = subscription_usage.subscription_id
      AND private.owns_client(cs.client_id)
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_usage TO anon, authenticated;
GRANT ALL ON public.subscription_usage TO service_role;

-- ============================================================
-- 11. coffee_records -> no more public read/insert
-- ============================================================
DROP POLICY IF EXISTS "Public can read coffee_records" ON public.coffee_records;
DROP POLICY IF EXISTS "Public can insert coffee_records" ON public.coffee_records;

CREATE POLICY "Totem can manage coffee_records"
  ON public.coffee_records FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Barbers can view coffee_records"
  ON public.coffee_records FOR SELECT TO authenticated
  USING (private.is_this_barber(barber_id) OR public.is_barber_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coffee_records TO anon, authenticated;
GRANT ALL ON public.coffee_records TO service_role;

-- ============================================================
-- 12. appointment_ratings -> public read kept (social proof), writes locked
-- ============================================================
DROP POLICY IF EXISTS "Admins can update ratings" ON public.appointment_ratings;
DROP POLICY IF EXISTS "Admins can delete ratings" ON public.appointment_ratings;
DROP POLICY IF EXISTS "Anyone can create ratings" ON public.appointment_ratings;

CREATE POLICY "Admins can update ratings"
  ON public.appointment_ratings FOR UPDATE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Admins can delete ratings"
  ON public.appointment_ratings FOR DELETE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Totem and clients can create ratings"
  ON public.appointment_ratings FOR INSERT TO anon, authenticated
  WITH CHECK (private.is_totem_request() OR private.owns_client(client_id));

GRANT SELECT ON public.appointment_ratings TO anon;
GRANT INSERT ON public.appointment_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_ratings TO authenticated;
GRANT ALL ON public.appointment_ratings TO service_role;

-- ============================================================
-- 13. active_sessions -> no anonymous/NULL-owner session spoofing
-- ============================================================
DROP POLICY IF EXISTS "Users can create own sessions" ON public.active_sessions;

CREATE POLICY "Users can create own sessions"
  ON public.active_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR private.is_totem_request()
  );

GRANT SELECT, INSERT, UPDATE ON public.active_sessions TO authenticated;
GRANT INSERT ON public.active_sessions TO anon;
GRANT ALL ON public.active_sessions TO service_role;

-- ============================================================
-- 14. notifications -> only the system can create them
-- ============================================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT TO service_role
  WITH CHECK (true);

REVOKE INSERT ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- ============================================================
-- 15. appointments (legacy) -> no unrestricted public insert
-- ============================================================
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;

CREATE POLICY "Totem can manage legacy appointments"
  ON public.appointments FOR ALL TO anon, authenticated
  USING (private.is_totem_request())
  WITH CHECK (private.is_totem_request());

CREATE POLICY "Authenticated users can create appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated staff can view appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.is_admin_or_higher(auth.uid()) OR public.is_barber_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO anon, authenticated;
GRANT ALL ON public.appointments TO service_role;

-- ============================================================
-- 16. STORAGE: gallery + products writable by admins only
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%gallery%' OR policyname ILIKE '%product%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "gallery public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery');

CREATE POLICY "gallery admin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin_or_higher(auth.uid()));

CREATE POLICY "gallery admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND public.is_admin_or_higher(auth.uid()))
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin_or_higher(auth.uid()));

CREATE POLICY "gallery admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.is_admin_or_higher(auth.uid()));

CREATE POLICY "products public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'products');

CREATE POLICY "products admin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products' AND public.is_admin_or_higher(auth.uid()));

CREATE POLICY "products admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND public.is_admin_or_higher(auth.uid()))
  WITH CHECK (bucket_id = 'products' AND public.is_admin_or_higher(auth.uid()));

CREATE POLICY "products admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND public.is_admin_or_higher(auth.uid()));

-- ============================================================
-- 17. FIX MUTABLE search_path
-- ============================================================
ALTER FUNCTION public.array_to_comma_string(text[]) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_public_appointment(uuid, uuid, uuid, timestamptz, timestamptz, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_public_client(text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_staff_module_access(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.push_subscriptions_touch_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_staff_module_access(uuid, text[]) SET search_path = public, pg_temp;

-- ============================================================
-- 18. REVOKE EXECUTE on internal / admin-only SECURITY DEFINER functions
-- ============================================================

-- Trigger functions are never called directly through the API.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE n.nspname = 'public' AND t.typname = 'trigger'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
  END LOOP;
END $$;

-- Admin / internal-only routines: never callable by anonymous visitors.
REVOKE ALL ON FUNCTION public.apply_vale_to_commissions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revert_vale_from_commissions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.force_logout_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_active_sessions() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_monthly_login_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_birthday_clients() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_admin_activity(text, text, uuid, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_staff_module_access(uuid, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_staff_module_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fila_do_dia() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.public_clients_count() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.public_client_names(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_appointment_by_client(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_painel_appointment_by_client(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_presence(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_coupon_to_appointment(uuid, text) FROM PUBLIC, anon;

-- Maintenance jobs: service role only.
REVOKE ALL ON FUNCTION public.cleanup_expired_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_locked_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.retention_cleanup_30_days() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_push(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_clients_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.next_matricula() FROM PUBLIC, anon;

-- Make sure the admin surface stays usable for signed-in staff.
GRANT EXECUTE ON FUNCTION public.apply_vale_to_commissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_vale_from_commissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_logout_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_login_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_birthday_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_activity(text, text, uuid, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_staff_module_access(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_module_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fila_do_dia() TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_clients_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_client_names(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_painel_appointment_by_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_presence(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_coupon_to_appointment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clients_overview() TO authenticated;
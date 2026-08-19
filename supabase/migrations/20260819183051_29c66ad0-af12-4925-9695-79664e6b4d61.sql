GRANT SELECT ON public.totem_sessions TO authenticated;

DROP POLICY IF EXISTS "Admins can read totem sessions" ON public.totem_sessions;
CREATE POLICY "Admins can read totem sessions"
ON public.totem_sessions
FOR SELECT
TO authenticated
USING (public.is_admin_or_higher(auth.uid()) OR public.is_barber_admin(auth.uid()));

DROP POLICY IF EXISTS "Totem can read own sessions" ON public.totem_sessions;
CREATE POLICY "Totem can read own sessions"
ON public.totem_sessions
FOR SELECT
TO anon, authenticated
USING (private.is_totem_request());
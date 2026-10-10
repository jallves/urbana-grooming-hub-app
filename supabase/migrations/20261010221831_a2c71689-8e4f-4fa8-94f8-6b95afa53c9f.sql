DROP POLICY IF EXISTS "authenticated_users_manage_banners" ON public.banner_images;
CREATE POLICY "Admins manage banners" ON public.banner_images FOR ALL TO authenticated
  USING (public.is_admin_or_higher(auth.uid())) WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "authenticated_users_manage_gallery" ON public.gallery_images;
CREATE POLICY "Admins manage gallery" ON public.gallery_images FOR ALL TO authenticated
  USING (public.is_admin_or_higher(auth.uid())) WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.admin_activity_log;
CREATE POLICY "Staff can insert logs" ON public.admin_activity_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_higher(auth.uid()) OR public.is_barber_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;

DROP POLICY IF EXISTS "Public can read categories" ON public.cash_flow_categories;
CREATE POLICY "Staff can read categories" ON public.cash_flow_categories FOR SELECT TO authenticated
  USING (public.is_admin_or_higher(auth.uid()) OR public.is_barber_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'));

DROP POLICY IF EXISTS "Allow public insert for totem" ON public.painel_clientes;
CREATE POLICY "Staff, totem or self can insert clients" ON public.painel_clientes FOR INSERT TO anon, authenticated
  WITH CHECK (
    private.is_totem_request()
    OR public.is_admin_or_higher(auth.uid())
    OR public.is_barber_admin(auth.uid())
    OR public.has_role(auth.uid(),'barber')
    OR public.has_role(auth.uid(),'manager')
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );
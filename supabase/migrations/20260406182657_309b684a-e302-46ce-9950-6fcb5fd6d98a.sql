CREATE POLICY "Barber admins can insert appointments"
ON public.painel_agendamentos
FOR INSERT
TO authenticated
WITH CHECK (public.is_barber_admin(auth.uid()));
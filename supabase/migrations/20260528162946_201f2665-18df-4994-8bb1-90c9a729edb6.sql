-- Allow barbers to manage their own working_hours
-- working_hours.staff_id references staff.id; staff.staff_id stores auth.uid()

CREATE POLICY "Barbers can manage own working hours"
ON public.working_hours
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = working_hours.staff_id
      AND s.staff_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = working_hours.staff_id
      AND s.staff_id = auth.uid()
  )
);

-- Allow barber admins to manage all working hours
CREATE POLICY "Barber admins can manage all working hours"
ON public.working_hours
FOR ALL
TO authenticated
USING (public.is_barber_admin(auth.uid()))
WITH CHECK (public.is_barber_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_hours TO authenticated;
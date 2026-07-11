DROP POLICY IF EXISTS "Users can view own employee row" ON public.employees;
CREATE POLICY "Users can view own employee row"
ON public.employees
FOR SELECT
TO authenticated
USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
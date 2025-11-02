-- Drop existing restrictive policies on painel_agendamentos if any
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Allow insert for admin users" ON public.painel_agendamentos;

-- Create permissive policy to allow inserts on painel_agendamentos
CREATE POLICY "Allow all inserts on painel_agendamentos"
ON public.painel_agendamentos
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Also ensure SELECT policy exists for reading
DROP POLICY IF EXISTS "Allow all selects on painel_agendamentos" ON public.painel_agendamentos;
CREATE POLICY "Allow all selects on painel_agendamentos"
ON public.painel_agendamentos
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow updates as well
DROP POLICY IF EXISTS "Allow all updates on painel_agendamentos" ON public.painel_agendamentos;
CREATE POLICY "Allow all updates on painel_agendamentos"
ON public.painel_agendamentos
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);
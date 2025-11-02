-- Enable RLS on painel_agendamentos if not enabled
ALTER TABLE public.painel_agendamentos ENABLE ROW LEVEL SECURITY;

-- Ensure the insert policy is properly set
DROP POLICY IF EXISTS "Allow all inserts on painel_agendamentos" ON public.painel_agendamentos;
CREATE POLICY "Allow all inserts on painel_agendamentos"
ON public.painel_agendamentos
FOR INSERT
TO public
WITH CHECK (true);

-- Ensure SELECT policy
DROP POLICY IF EXISTS "Allow all selects on painel_agendamentos" ON public.painel_agendamentos;
CREATE POLICY "Allow all selects on painel_agendamentos"
ON public.painel_agendamentos
FOR SELECT
TO public
USING (true);

-- Ensure UPDATE policy
DROP POLICY IF EXISTS "Allow all updates on painel_agendamentos" ON public.painel_agendamentos;
CREATE POLICY "Allow all updates on painel_agendamentos"
ON public.painel_agendamentos
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
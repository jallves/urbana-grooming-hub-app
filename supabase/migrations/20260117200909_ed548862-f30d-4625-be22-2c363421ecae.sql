-- Fix RLS policy that referenced auth.users (causing 403: permission denied for table users)
-- Use painel_barbeiros.staff_id (which stores the auth user id for barbers) instead.

DROP POLICY IF EXISTS "Barbers can view own financial records" ON public.financial_records;

CREATE POLICY "Barbers can view own financial records"
ON public.financial_records
FOR SELECT
TO authenticated
USING (
  barber_id IN (
    SELECT pb.id
    FROM public.painel_barbeiros pb
    WHERE pb.staff_id = auth.uid()
  )
);

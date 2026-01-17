-- Fix RLS policy for barber_commissions that references auth.users (causing permission denied)
-- Use painel_barbeiros.staff_id which stores the user's auth.uid()

DROP POLICY IF EXISTS "Barbers can view own commissions" ON public.barber_commissions;

CREATE POLICY "Barbers can view own commissions"
ON public.barber_commissions
FOR SELECT
TO authenticated
USING (
  barber_id IN (
    SELECT pb.id
    FROM public.painel_barbeiros pb
    WHERE pb.staff_id = auth.uid()
  )
);
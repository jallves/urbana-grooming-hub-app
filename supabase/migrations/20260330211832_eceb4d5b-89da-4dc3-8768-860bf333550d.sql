
-- Add is_barber_admin column to painel_barbeiros
ALTER TABLE public.painel_barbeiros 
ADD COLUMN IF NOT EXISTS is_barber_admin boolean NOT NULL DEFAULT false;

-- Update Carlos Firme as barber admin
UPDATE public.painel_barbeiros 
SET is_barber_admin = true 
WHERE id = 'd99d42ba-4987-45f5-a817-2cecbccadad9';

-- Create a security definer function to check if user is barber admin
CREATE OR REPLACE FUNCTION public.is_barber_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.painel_barbeiros pb
    WHERE pb.staff_id = _user_id
      AND pb.is_barber_admin = true
      AND pb.is_active = true
  )
$$;

-- Allow barber admins to view all appointments (they can already see public ones, but need update)
CREATE POLICY "Barber admins can update all appointments"
ON public.painel_agendamentos
FOR UPDATE
TO authenticated
USING (public.is_barber_admin(auth.uid()))
WITH CHECK (public.is_barber_admin(auth.uid()));

-- Allow barber admins to view all barber commissions
CREATE POLICY "Barber admins can view all commissions"
ON public.barber_commissions
FOR SELECT
TO authenticated
USING (public.is_barber_admin(auth.uid()));

-- Allow barber admins to view all financial records
CREATE POLICY "Barber admins can view all financial records"
ON public.financial_records
FOR SELECT
TO authenticated
USING (public.is_barber_admin(auth.uid()));

-- Allow barber admins to manage barber_availability for all barbers
CREATE POLICY "Barber admins can manage all availability"
ON public.barber_availability
FOR ALL
TO authenticated
USING (public.is_barber_admin(auth.uid()))
WITH CHECK (public.is_barber_admin(auth.uid()));

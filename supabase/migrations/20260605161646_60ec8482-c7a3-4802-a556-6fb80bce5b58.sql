
-- Make is_admin_or_higher more robust: also recognizes admins listed in admin_users
-- (defense in depth so a missing user_roles entry doesn't block legitimate admins)
CREATE OR REPLACE FUNCTION public.is_admin_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('master', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = _user_id
      AND COALESCE(au.is_active, true) = true
      AND COALESCE(au.role, 'admin') IN ('admin','master','manager')
  )
  OR EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.admin_users au ON lower(trim(au.email)) = lower(trim(u.email))
    WHERE u.id = _user_id
      AND COALESCE(au.is_active, true) = true
      AND COALESCE(au.role, 'admin') IN ('admin','master','manager')
  );
$$;

-- Backfill: ensure every active admin_users row has a matching user_roles entry,
-- so RLS via user_roles also works for them.
INSERT INTO public.user_roles (user_id, role)
SELECT au.user_id,
       (CASE WHEN au.role = 'master' THEN 'master' ELSE 'admin' END)::app_role
  FROM public.admin_users au
 WHERE au.user_id IS NOT NULL
   AND COALESCE(au.is_active, true) = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Also link admin_users by email when user_id is null but auth.users exists
UPDATE public.admin_users au
   SET user_id = u.id
  FROM auth.users u
 WHERE au.user_id IS NULL
   AND lower(trim(au.email)) = lower(trim(u.email));

INSERT INTO public.user_roles (user_id, role)
SELECT au.user_id,
       (CASE WHEN au.role = 'master' THEN 'master' ELSE 'admin' END)::app_role
  FROM public.admin_users au
 WHERE au.user_id IS NOT NULL
   AND COALESCE(au.is_active, true) = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Explicit, redundant policies guaranteeing admins can UPDATE/DELETE employees,
-- staff and painel_barbeiros (covers edits and inactivation flows).
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
CREATE POLICY "Admins can update employees" ON public.employees
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
CREATE POLICY "Admins can delete employees" ON public.employees
  FOR DELETE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
CREATE POLICY "Admins can insert employees" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Admins can update staff" ON public.staff;
CREATE POLICY "Admins can update staff" ON public.staff
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete staff" ON public.staff;
CREATE POLICY "Admins can delete staff" ON public.staff
  FOR DELETE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Admins can update painel_barbeiros" ON public.painel_barbeiros;
CREATE POLICY "Admins can update painel_barbeiros" ON public.painel_barbeiros
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete painel_barbeiros" ON public.painel_barbeiros;
CREATE POLICY "Admins can delete painel_barbeiros" ON public.painel_barbeiros
  FOR DELETE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()));

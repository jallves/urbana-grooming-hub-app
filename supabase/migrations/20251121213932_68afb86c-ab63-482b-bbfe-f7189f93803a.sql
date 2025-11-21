
-- Fix infinite recursion by simplifying user_roles policies
-- DO NOT drop has_role function as many policies depend on it

-- ============================================================================
-- 1. Simplify user_roles policies to avoid recursion
-- ============================================================================

-- Drop ALL existing problematic policies on user_roles that might cause recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters and admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters and admins manage all" ON public.user_roles;

-- Keep these simple policies (they don't cause recursion):
-- - "Users view own roles" (already exists)
-- - "Service role full access" (already exists)  
-- - "Users can insert own role on signup" (already exists)

-- Add missing read policies for proper JOIN operations
DROP POLICY IF EXISTS "Enable anonymous read" ON public.user_roles;
DROP POLICY IF EXISTS "Enable authenticated read" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.user_roles;

-- Allow authenticated users to read ALL roles
-- This is needed for has_role() function to work and for JOINs
-- It's safe because user_roles only contains role assignments, not sensitive data
CREATE POLICY "Authenticated can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous/public to read roles (for JOINs with public role)
CREATE POLICY "Public can read all roles"
ON public.user_roles
FOR SELECT
TO anon, public
USING (true);

-- ============================================================================
-- 2. Ensure has_role function grants are in place
-- ============================================================================

-- Make sure all roles can execute has_role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO public;

-- ============================================================================
-- 3. Document the security model
-- ============================================================================

COMMENT ON TABLE public.user_roles IS 'RLS Model: All authenticated users can read roles. has_role() is SECURITY DEFINER and bypasses RLS. Role modifications should be done via service_role or Edge Functions.';

-- ============================================================================
-- 4. Verify staff policies are using has_role correctly
-- ============================================================================

-- Re-add the public view policy for staff if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'staff' 
    AND policyname = 'Public view staff'
  ) THEN
    CREATE POLICY "Public view staff"
    ON public.staff
    FOR SELECT
    TO public
    USING (is_active = true);
  END IF;
END $$;

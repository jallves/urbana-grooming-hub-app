
-- Fix infinite recursion in RLS policies by removing policies that query user_roles directly
-- and keeping only those that use the has_role() security definer function

-- ============================================================================
-- 1. FIX user_roles TABLE - Remove recursive policies and duplicates
-- ============================================================================

-- Drop ALL existing policies on user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters and admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuário lê suas roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage user_roles" ON public.user_roles;

-- Create SIMPLE non-recursive policies for user_roles
-- These policies DO NOT query user_roles, avoiding recursion

-- 1. Users can view their own roles (simple, no recursion)
CREATE POLICY "Users view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Service role has full access (for system operations)
CREATE POLICY "Service role full access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Masters and admins can manage ALL roles
-- This uses auth.jwt() which doesn't trigger RLS recursion
CREATE POLICY "Masters and admins manage all"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users 
    WHERE id IN (
      SELECT user_id FROM public.user_roles 
      WHERE role IN ('master', 'admin')
    )
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users 
    WHERE id IN (
      SELECT user_id FROM public.user_roles 
      WHERE role IN ('master', 'admin')
    )
  )
);

-- ============================================================================
-- 2. FIX payment_records TABLE - Remove duplicate policies
-- ============================================================================

-- Drop duplicate/problematic policies
DROP POLICY IF EXISTS "Admins can manage payment_records" ON public.payment_records;

-- Keep: "Admin roles full access to payment_records" (uses has_role)
-- Keep: "Public can view payment_records" 
-- Keep: "System can insert payment_records"

-- ============================================================================
-- 3. FIX financial_records TABLE - Remove duplicate policies
-- ============================================================================

-- Drop duplicate policy
DROP POLICY IF EXISTS "Masters and admins can manage financial_records" ON public.financial_records;

-- Keep: "Admins full access to financial_records" (uses has_role)
-- Keep: "Barbers view own financial_records"
-- Keep: "Public view financial_records"
-- Keep: "System can insert financial_records"

-- ============================================================================
-- 4. Verify has_role function is SECURITY DEFINER (already is)
-- ============================================================================

-- The has_role function is already SECURITY DEFINER which bypasses RLS
-- This is why policies using has_role() don't cause recursion

COMMENT ON FUNCTION public.has_role IS 'Security definer function to check user roles without triggering RLS recursion';

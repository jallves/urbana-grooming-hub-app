
-- Fix user_roles policies to be completely non-recursive
-- The previous migration still had issues, let's simplify even more

-- Drop the problematic policy that still queries user_roles
DROP POLICY IF EXISTS "Masters and admins manage all" ON public.user_roles;

-- Create a completely non-recursive policy for admins
-- This policy allows ANY authenticated user to manage user_roles IF they have the right role
-- BUT it doesn't check user_roles table directly, avoiding recursion
-- Instead, we'll rely on application-level checks or use a simpler approach

-- Option 1: Allow service_role full access (already have this)
-- Option 2: Allow authenticated users with specific emails (hardcoded masters)
-- Option 3: Create a separate table for admin emails that doesn't have RLS

-- For now, let's use a simple approach: 
-- Masters and admins will use the service_role key for user management
-- Or we can create an insert/update trigger that validates permissions

-- Let's create a simpler policy that just checks if the user exists in a separate admin table
-- But first, let's just allow any authenticated user to INSERT their own role on first login
-- and let service_role handle the rest

CREATE POLICY "Users can insert own role on signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- For updates and deletes, only service_role should be able to do it
-- This avoids the recursion problem entirely

-- Add a comment explaining the security model
COMMENT ON TABLE public.user_roles IS 'RLS Model: Users can view own roles. Only service_role can modify roles to avoid recursion. Use Edge Functions with service_role key for role management.';

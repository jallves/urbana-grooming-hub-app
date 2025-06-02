
-- Create a database function to add barber users
-- This function will be used to safely add barbers to the admin_users table
-- without hitting RLS policy issues
CREATE OR REPLACE FUNCTION public.add_barber_user(
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'barber'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Insert the new barber user
  INSERT INTO public.admin_users (email, name, role, created_at)
  VALUES (p_email, p_name, p_role, now())
  RETURNING id INTO v_user_id;
  
  -- Add role entry to user_roles table if needed
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, p_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_barber_user TO authenticated;

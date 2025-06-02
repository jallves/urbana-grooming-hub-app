CREATE OR REPLACE FUNCTION public.add_barber_user(
  p_email TEXT,
  p_name TEXT
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Insert the new barber user with FIXED role
  INSERT INTO public.admin_users (email, name, role, created_at)
  VALUES (p_email, p_name, 'barber', now())  -- Role fixo como 'barber'
  RETURNING id INTO v_user_id;
  
  -- Add role entry to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'barber'::app_role)  -- Conversão explícita para app_role
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_barber_user(TEXT, TEXT) TO authenticated;


-- Function to create or find a client and return the client ID
CREATE OR REPLACE FUNCTION public.create_public_client(
  client_name TEXT,
  client_phone TEXT, 
  client_email TEXT
) RETURNS uuid 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id uuid;
BEGIN
  -- Check if client exists with this phone number
  SELECT id INTO client_id 
  FROM public.clients
  WHERE phone = client_phone
  LIMIT 1;
  
  -- If no client found, create a new one
  IF client_id IS NULL THEN
    INSERT INTO public.clients (name, phone, email)
    VALUES (client_name, client_phone, client_email)
    RETURNING id INTO client_id;
  END IF;
  
  RETURN client_id;
END;
$$;

-- Function to create a public appointment
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_client_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_notes text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_id uuid;
BEGIN
  INSERT INTO public.appointments (
    client_id,
    service_id,
    staff_id,
    start_time,
    end_time,
    status,
    notes
  ) VALUES (
    p_client_id,
    p_service_id,
    p_staff_id,
    p_start_time,
    p_end_time,
    'scheduled',
    p_notes
  )
  RETURNING id INTO appointment_id;
  
  RETURN appointment_id;
END;
$$;

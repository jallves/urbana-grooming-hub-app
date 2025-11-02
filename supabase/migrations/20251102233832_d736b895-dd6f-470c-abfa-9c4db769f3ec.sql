-- Create a function to insert appointments with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.insert_painel_agendamento(
  p_cliente_id uuid,
  p_barbeiro_id uuid,
  p_servico_id uuid,
  p_data date,
  p_hora time,
  p_status text DEFAULT 'agendado'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agendamento_id uuid;
BEGIN
  INSERT INTO public.painel_agendamentos (
    cliente_id,
    barbeiro_id,
    servico_id,
    data,
    hora,
    status
  ) VALUES (
    p_cliente_id,
    p_barbeiro_id,
    p_servico_id,
    p_data,
    p_hora,
    p_status
  )
  RETURNING id INTO v_agendamento_id;
  
  RETURN v_agendamento_id;
END;
$$;
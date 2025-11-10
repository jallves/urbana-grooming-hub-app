-- Atualizar função para usar cast correto (status_totem é um ENUM)
CREATE OR REPLACE FUNCTION public.update_agendamento_status_totem(
  p_agendamento_id UUID,
  p_status_totem TEXT,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.painel_agendamentos
  SET 
    status_totem = p_status_totem::status_agendamento,
    status = p_status,
    updated_at = NOW()
  WHERE id = p_agendamento_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado: %', p_agendamento_id;
  END IF;
END;
$$;
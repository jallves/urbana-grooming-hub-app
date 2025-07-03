
-- Função para buscar todos os barbeiros
CREATE OR REPLACE FUNCTION get_painel_barbeiros()
RETURNS SETOF public.painel_barbeiros
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.painel_barbeiros
  ORDER BY nome;
END;
$$;

-- Função para buscar todos os serviços
CREATE OR REPLACE FUNCTION get_painel_servicos()
RETURNS SETOF public.painel_servicos
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.painel_servicos
  ORDER BY nome;
END;
$$;

-- Função para buscar agendamentos por barbeiro e data
CREATE OR REPLACE FUNCTION get_agendamentos_barbeiro_data(
  barbeiro_id UUID,
  data_agendamento DATE
)
RETURNS TABLE (
  id UUID,
  hora TIME,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.hora,
    a.status
  FROM public.painel_agendamentos a
  WHERE a.barbeiro_id = get_agendamentos_barbeiro_data.barbeiro_id
    AND a.data = data_agendamento
    AND a.status != 'cancelado';
END;
$$;

-- Função para criar um novo agendamento
CREATE OR REPLACE FUNCTION create_painel_agendamento(
  cliente_id UUID,
  barbeiro_id UUID,
  servico_id UUID,
  data DATE,
  hora TIME
)
RETURNS public.painel_agendamentos
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  novo_agendamento public.painel_agendamentos;
BEGIN
  -- Verificar se o horário está disponível
  IF EXISTS (
    SELECT 1 FROM public.painel_agendamentos
    WHERE painel_agendamentos.barbeiro_id = create_painel_agendamento.barbeiro_id
      AND painel_agendamentos.data = create_painel_agendamento.data
      AND painel_agendamentos.hora = create_painel_agendamento.hora
      AND status != 'cancelado'
  ) THEN
    RAISE EXCEPTION 'Horário já está ocupado';
  END IF;

  INSERT INTO public.painel_agendamentos (cliente_id, barbeiro_id, servico_id, data, hora)
  VALUES (cliente_id, barbeiro_id, servico_id, data, hora)
  RETURNING * INTO novo_agendamento;
  
  RETURN novo_agendamento;
END;
$$;


-- Função para verificar se um email já existe
CREATE OR REPLACE FUNCTION check_painel_cliente_email(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.painel_clientes 
    WHERE email = email_to_check
  );
END;
$$;

-- Função para criar um novo cliente
CREATE OR REPLACE FUNCTION create_painel_cliente(
  nome TEXT,
  email TEXT,
  whatsapp TEXT,
  senha_hash TEXT
)
RETURNS public.painel_clientes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  novo_cliente public.painel_clientes;
BEGIN
  INSERT INTO public.painel_clientes (nome, email, whatsapp, senha_hash)
  VALUES (nome, email, whatsapp, senha_hash)
  RETURNING * INTO novo_cliente;
  
  RETURN novo_cliente;
END;
$$;

-- Função para autenticar cliente
CREATE OR REPLACE FUNCTION authenticate_painel_cliente(
  email TEXT,
  senha_hash TEXT
)
RETURNS public.painel_clientes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cliente_data public.painel_clientes;
BEGIN
  SELECT * INTO cliente_data
  FROM public.painel_clientes
  WHERE painel_clientes.email = authenticate_painel_cliente.email
    AND painel_clientes.senha_hash = authenticate_painel_cliente.senha_hash;
  
  RETURN cliente_data;
END;
$$;

-- Função para buscar cliente por ID
CREATE OR REPLACE FUNCTION get_painel_cliente_by_id(cliente_id UUID)
RETURNS public.painel_clientes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cliente_data public.painel_clientes;
BEGIN
  SELECT * INTO cliente_data
  FROM public.painel_clientes
  WHERE id = cliente_id;
  
  RETURN cliente_data;
END;
$$;

-- Função para atualizar perfil do cliente
CREATE OR REPLACE FUNCTION update_painel_cliente(
  cliente_id UUID,
  nome TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  whatsapp TEXT DEFAULT NULL
)
RETURNS public.painel_clientes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cliente_atualizado public.painel_clientes;
BEGIN
  UPDATE public.painel_clientes
  SET 
    nome = COALESCE(update_painel_cliente.nome, painel_clientes.nome),
    email = COALESCE(update_painel_cliente.email, painel_clientes.email),
    whatsapp = COALESCE(update_painel_cliente.whatsapp, painel_clientes.whatsapp),
    updated_at = now()
  WHERE id = cliente_id
  RETURNING * INTO cliente_atualizado;
  
  RETURN cliente_atualizado;
END;
$$;

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

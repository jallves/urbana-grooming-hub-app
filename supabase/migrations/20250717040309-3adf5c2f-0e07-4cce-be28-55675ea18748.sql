
-- Atualizar a tabela painel_clientes para incluir data_nascimento
ALTER TABLE public.painel_clientes 
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Função para criar cliente do painel com data de nascimento
CREATE OR REPLACE FUNCTION public.create_painel_cliente_with_birth_date(
  nome text, 
  email text, 
  whatsapp text, 
  data_nascimento date,
  senha_hash text
)
RETURNS painel_clientes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  novo_cliente public.painel_clientes;
BEGIN
  INSERT INTO public.painel_clientes (nome, email, whatsapp, data_nascimento, senha_hash)
  VALUES (nome, email, whatsapp, data_nascimento, senha_hash)
  RETURNING * INTO novo_cliente;
  
  RETURN novo_cliente;
END;
$$;

-- Função para atualizar cliente do painel com data de nascimento
CREATE OR REPLACE FUNCTION public.update_painel_cliente_with_birth_date(
  cliente_id uuid, 
  nome text DEFAULT NULL::text, 
  email text DEFAULT NULL::text, 
  whatsapp text DEFAULT NULL::text,
  data_nascimento date DEFAULT NULL::date
)
RETURNS painel_clientes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cliente_atualizado public.painel_clientes;
BEGIN
  UPDATE public.painel_clientes
  SET 
    nome = COALESCE(update_painel_cliente_with_birth_date.nome, painel_clientes.nome),
    email = COALESCE(update_painel_cliente_with_birth_date.email, painel_clientes.email),
    whatsapp = COALESCE(update_painel_cliente_with_birth_date.whatsapp, painel_clientes.whatsapp),
    data_nascimento = COALESCE(update_painel_cliente_with_birth_date.data_nascimento, painel_clientes.data_nascimento),
    updated_at = now()
  WHERE id = cliente_id
  RETURNING * INTO cliente_atualizado;
  
  RETURN cliente_atualizado;
END;
$$;

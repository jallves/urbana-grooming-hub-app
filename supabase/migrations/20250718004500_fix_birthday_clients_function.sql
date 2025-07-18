
-- Atualizar função para buscar aniversariantes da tabela painel_clientes
CREATE OR REPLACE FUNCTION public.get_birthday_clients(target_month integer DEFAULT NULL::integer)
RETURNS TABLE(id uuid, name text, email text, phone text, birth_date date, whatsapp text, age integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.nome as name,
    pc.email,
    pc.whatsapp as phone,
    pc.data_nascimento as birth_date,
    pc.whatsapp,
    EXTRACT(YEAR FROM AGE(pc.data_nascimento))::INTEGER as age
  FROM public.painel_clientes pc
  WHERE pc.data_nascimento IS NOT NULL
  AND EXTRACT(MONTH FROM pc.data_nascimento) = COALESCE(target_month, EXTRACT(MONTH FROM CURRENT_DATE))
  ORDER BY EXTRACT(DAY FROM pc.data_nascimento);
END;
$$;

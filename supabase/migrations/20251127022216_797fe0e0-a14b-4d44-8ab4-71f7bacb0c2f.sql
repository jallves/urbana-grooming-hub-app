-- ========================================
-- CORREÇÃO: Função get_birthday_clients (tipos corretos)
-- ========================================

DROP FUNCTION IF EXISTS public.get_birthday_clients(integer);

CREATE OR REPLACE FUNCTION public.get_birthday_clients(target_month integer DEFAULT NULL::integer)
RETURNS TABLE(
  id uuid, 
  name text,                      -- nome é text
  email character varying(255),   -- email é varchar(255)
  phone text,                     -- whatsapp é text (não varchar!)
  birth_date date,                -- data_nascimento é date
  whatsapp text,                  -- whatsapp é text
  age integer                     -- calculado
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

COMMENT ON FUNCTION public.get_birthday_clients(integer) IS 
  'Retorna lista de aniversariantes do mês especificado com tipos corretos.';

-- ========================================
-- TESTE: Verificar se funciona agora
-- ========================================
DO $$
DECLARE
  result_count INTEGER;
  current_month INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  
  SELECT COUNT(*) INTO result_count
  FROM get_birthday_clients(current_month);
  
  RAISE NOTICE '✅ Função corrigida e testada com sucesso!';
  RAISE NOTICE '📅 Mês atual: %', current_month;
  RAISE NOTICE '🎂 Aniversariantes encontrados: %', result_count;
END $$;
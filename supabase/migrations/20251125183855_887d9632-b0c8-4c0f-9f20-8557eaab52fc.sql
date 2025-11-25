-- Criar função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_client_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir apenas se o user_type for 'client'
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    INSERT INTO public.client_profiles (
      id,
      nome,
      whatsapp,
      data_nascimento
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
      NEW.raw_user_meta_data->>'whatsapp',
      (NEW.raw_user_meta_data->>'data_nascimento')::date
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para chamar a função quando um usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_client_user();

-- Adicionar política RLS para permitir que a função SECURITY DEFINER insira dados
-- (a função roda com permissões de owner, então tecnicamente não precisa da política,
-- mas é boa prática ter políticas claras)

-- Permitir que usuários autenticados leiam seu próprio perfil (já existe)
-- Permitir que usuários autenticados atualizem seu próprio perfil (já existe)

-- Comentário: A função handle_new_client_user usa SECURITY DEFINER,
-- então ela pode inserir em client_profiles mesmo sem política RLS de INSERT
-- porque roda com privilégios do owner do banco
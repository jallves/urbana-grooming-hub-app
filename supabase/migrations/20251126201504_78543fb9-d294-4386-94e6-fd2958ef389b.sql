-- Criar função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir na tabela client_profiles
  INSERT INTO public.client_profiles (id, nome, whatsapp, data_nascimento)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', 'temp-' || NEW.id::text),
    COALESCE((NEW.raw_user_meta_data->>'data_nascimento')::date, NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que dispara após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Criar perfil específico para o usuário atual que está sem (usando email como nome)
INSERT INTO public.client_profiles (id, nome, whatsapp)
VALUES (
  '3a621fb8-b0ff-4b11-b076-c83aa27fdff0',
  'bruninhacoli@gmail.com',
  'temp-3a621fb8-b0ff-4b11-b076-c83aa27fdff0'
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome;

COMMENT ON FUNCTION public.handle_new_user_profile() IS 'Cria automaticamente um perfil em client_profiles quando um novo usuário é criado em auth.users';
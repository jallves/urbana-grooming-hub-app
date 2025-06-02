-- Criação de tipo de role caso não exista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'barber', 'user');
  END IF;
END$$;

-- Tabela de roles de usuário
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (versão melhorada)
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = _role
  );
$$;

-- Política para permitir que usuários vejam seus próprios papéis
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Políticas completas para administradores
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Opcional: Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx 
ON public.user_roles (user_id);

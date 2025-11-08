-- Enable RLS on public content tables and auth helper tables
ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_barbeiros ENABLE ROW LEVEL SECURITY;

-- user_roles: authenticated users can read their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Usuário lê suas roles'
  ) THEN
    CREATE POLICY "Usuário lê suas roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- painel_barbeiros: authenticated user can read their own active barber record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'painel_barbeiros' AND policyname = 'Barbeiro lê seu registro ativo'
  ) THEN
    CREATE POLICY "Barbeiro lê seu registro ativo"
    ON public.painel_barbeiros
    FOR SELECT
    TO authenticated
    USING (
      is_active = true
      AND email = (auth.jwt() ->> 'email')
    );
  END IF;
END $$;

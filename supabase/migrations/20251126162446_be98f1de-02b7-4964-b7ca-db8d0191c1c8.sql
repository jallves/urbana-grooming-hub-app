-- Fix crítico: Liberar acesso público às tabelas de banner e galeria
-- Estas são informações públicas do site

-- 1. Banner Images: Permitir leitura pública
DROP POLICY IF EXISTS "banner_images_public_read" ON public.banner_images;
CREATE POLICY "banner_images_public_read"
ON public.banner_images
FOR SELECT
TO public
USING (is_active = true);

-- 2. Gallery Images: Permitir leitura pública  
DROP POLICY IF EXISTS "gallery_images_public_read" ON public.gallery_images;
CREATE POLICY "gallery_images_public_read"
ON public.gallery_images
FOR SELECT
TO public
USING (is_active = true);

-- 3. Liberar funções RPC de sessão para execução anônima
-- Estas funções precisam funcionar mesmo sem autenticação para não bloquear login

GRANT EXECUTE ON FUNCTION public.create_user_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_activity TO anon, authenticated;

-- 4. Ajustar RLS da tabela user_sessions para permitir operações necessárias
DROP POLICY IF EXISTS "user_sessions_insert_policy" ON public.user_sessions;
CREATE POLICY "user_sessions_insert_policy"
ON public.user_sessions
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "user_sessions_update_own" ON public.user_sessions;
CREATE POLICY "user_sessions_update_own"
ON public.user_sessions
FOR UPDATE
TO public
USING (true);
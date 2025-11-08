-- Políticas RLS públicas para acesso anônimo seguro às páginas públicas

-- 1. Banner Images - Permitir leitura pública apenas de banners ativos
CREATE POLICY "Permitir leitura pública de banners ativos"
ON public.banner_images
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 2. Gallery Photos - Permitir leitura pública apenas de fotos publicadas
CREATE POLICY "Permitir leitura pública de fotos publicadas"
ON public.gallery_photos
FOR SELECT
TO anon, authenticated
USING (published = true);

-- 3. Painel Servicos - Permitir leitura pública de todos os serviços
CREATE POLICY "Permitir leitura pública de serviços"
ON public.painel_servicos
FOR SELECT
TO anon, authenticated
USING (true);

-- Comentário: Essas políticas permitem que qualquer visitante (autenticado ou não)
-- possa visualizar os banners ativos, fotos publicadas e serviços na home page.
-- Atualizar políticas RLS para gallery_images
-- Remover política antiga que pode estar restritiva demais
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;

-- Criar política mais robusta para gerenciamento por usuários autenticados
CREATE POLICY "authenticated_users_manage_gallery"
  ON public.gallery_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Atualizar política de leitura pública para incluir todas as imagens (não só ativas)
-- já que queremos que o admin veja todas
DROP POLICY IF EXISTS "Public can read gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Anyone can view active gallery images" ON public.gallery_images;

CREATE POLICY "anyone_can_view_gallery"
  ON public.gallery_images
  FOR SELECT
  TO public
  USING (true);
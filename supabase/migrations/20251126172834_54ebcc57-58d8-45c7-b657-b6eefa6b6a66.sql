-- Garantir que as tabelas de mídia sejam acessíveis publicamente para SELECT
-- Remover políticas existentes e recriar de forma mais simples

-- Banner Images
DROP POLICY IF EXISTS "public_select_all_banners" ON public.banner_images;
DROP POLICY IF EXISTS "masters_admins_manage_banners" ON public.banner_images;

-- Permitir SELECT público sem condições
CREATE POLICY "anyone_can_view_banners"
  ON public.banner_images
  FOR SELECT
  TO public
  USING (true);

-- Permitir gerenciamento completo para authenticated com role master/admin
CREATE POLICY "admins_manage_banners"
  ON public.banner_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('master', 'admin')
    )
  );

-- Gallery Images
DROP POLICY IF EXISTS "public_select_all_gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "masters_admins_manage_gallery_images" ON public.gallery_images;

-- Permitir SELECT público sem condições
CREATE POLICY "anyone_can_view_gallery"
  ON public.gallery_images
  FOR SELECT
  TO public
  USING (true);

-- Permitir gerenciamento completo para authenticated com role master/admin
CREATE POLICY "admins_manage_gallery"
  ON public.gallery_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('master', 'admin')
    )
  );

-- Gallery Photos  
DROP POLICY IF EXISTS "public_select_all_gallery_photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "masters_admins_manage_gallery_photos" ON public.gallery_photos;

-- Permitir SELECT público sem condições
CREATE POLICY "anyone_can_view_gallery_photos"
  ON public.gallery_photos
  FOR SELECT
  TO public
  USING (true);

-- Permitir gerenciamento completo para authenticated com role master/admin
CREATE POLICY "admins_manage_gallery_photos"
  ON public.gallery_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('master', 'admin')
    )
  );
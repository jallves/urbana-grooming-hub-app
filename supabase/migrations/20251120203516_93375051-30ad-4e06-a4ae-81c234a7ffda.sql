-- Remover políticas antigas do bucket staff-photos
DROP POLICY IF EXISTS "Fotos de staff são públicas para visualização" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar fotos" ON storage.objects;

-- 🔓 Política: Qualquer pessoa pode VER as fotos (público)
CREATE POLICY "staff_photos_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'staff-photos');

-- 🔒 Política: Qualquer usuário AUTENTICADO pode FAZER UPLOAD
CREATE POLICY "staff_photos_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'staff-photos');

-- 🔒 Política: Qualquer usuário AUTENTICADO pode ATUALIZAR
CREATE POLICY "staff_photos_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'staff-photos')
WITH CHECK (bucket_id = 'staff-photos');

-- 🔒 Política: Qualquer usuário AUTENTICADO pode DELETAR
CREATE POLICY "staff_photos_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'staff-photos');
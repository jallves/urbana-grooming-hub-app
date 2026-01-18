-- Criar bucket para fotos de funcionários/barbeiros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('staff-photos', 'staff-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para staff-photos
CREATE POLICY "Fotos de staff são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'staff-photos');

CREATE POLICY "Admins podem fazer upload de fotos de staff" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'staff-photos' AND public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Admins podem atualizar fotos de staff" ON storage.objects
FOR UPDATE USING (bucket_id = 'staff-photos' AND public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Admins podem deletar fotos de staff" ON storage.objects
FOR DELETE USING (bucket_id = 'staff-photos' AND public.is_admin_or_higher(auth.uid()));
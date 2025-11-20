-- Criar bucket para fotos de barbeiros se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barber-photos',
  'barber-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket barber-photos
CREATE POLICY "Admins podem fazer upload de fotos de barbeiros"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barber-photos' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Admins podem atualizar fotos de barbeiros"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barber-photos' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Admins podem deletar fotos de barbeiros"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barber-photos' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Fotos de barbeiros são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barber-photos');

-- Criar bucket para fotos dos funcionários
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-photos', 'staff-photos', true);

-- Criar política para permitir upload de fotos dos funcionários
CREATE POLICY "Allow public uploads to staff photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'staff-photos');

-- Criar política para permitir leitura pública das fotos dos funcionários
CREATE POLICY "Allow public read access to staff photos" ON storage.objects
FOR SELECT USING (bucket_id = 'staff-photos');

-- Criar política para permitir atualização das fotos dos funcionários
CREATE POLICY "Allow public updates to staff photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'staff-photos');

-- Criar política para permitir exclusão das fotos dos funcionários
CREATE POLICY "Allow public delete from staff photos" ON storage.objects
FOR DELETE USING (bucket_id = 'staff-photos');

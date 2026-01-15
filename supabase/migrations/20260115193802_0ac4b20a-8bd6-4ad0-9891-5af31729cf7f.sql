
-- =============================================
-- RESTAURAÇÃO COMPLETA DOS DADOS INICIAIS
-- Barbearia Costa Urbana
-- =============================================

-- 1. INSERIR OS 34 SERVIÇOS OFICIAIS
-- =============================================
INSERT INTO painel_servicos (nome, preco, duracao, ativo, exibir_home, descricao, categoria) VALUES
('Corte', 50, 30, true, true, 'Corte masculino tradicional', 'Cabelo'),
('Barba', 50, 30, true, true, 'Barba completa com toalha quente', 'Barba'),
('Corte + Barba', 95, 60, true, true, 'Combo corte e barba', 'Combo'),
('Corte + Barba + Sobrancelha', 110, 60, true, false, 'Combo completo', 'Combo'),
('Corte + Sobrancelha', 70, 30, true, true, 'Corte com design de sobrancelha', 'Combo'),
('Corte + Tonalização', 120, 90, true, false, 'Corte com tonalização capilar', 'Combo'),
('Hidratação', 50, 45, true, false, 'Hidratação capilar profunda', 'Tratamento'),
('Hidratação V.O', 90, 45, true, false, 'Hidratação premium V.O', 'Tratamento'),
('Luzes', 130, 120, true, false, 'Luzes e mechas', 'Coloração'),
('Platinado', 180, 120, true, false, 'Platinado completo', 'Coloração'),
('Selagem', 130, 60, true, false, 'Selagem capilar', 'Tratamento'),
('Selagem + Corte', 170, 90, true, false, 'Selagem com corte incluso', 'Combo'),
('Botox Capilar', 130, 90, true, false, 'Botox capilar profissional', 'Tratamento'),
('Sobrancelha', 25, 15, true, true, 'Design de sobrancelha', 'Sobrancelha'),
('Sobrancelha Egípcia', 50, 30, true, false, 'Sobrancelha com linha egípcia', 'Sobrancelha'),
('Sobrancelha Pinça', 40, 30, true, false, 'Sobrancelha com pinça', 'Sobrancelha'),
('Limpeza de Pele', 120, 60, true, false, 'Limpeza de pele facial', 'Estética'),
('Revitalização Facial', 110, 60, true, false, 'Revitalização facial completa', 'Estética'),
('Detox com Manta + Massagem', 210, 120, true, false, 'Detox corporal com manta térmica e massagem', 'Spa'),
('Detox Corporal com Manta Térmica', 120, 60, true, false, 'Detox com manta térmica', 'Spa'),
('Drenagem Linfática', 120, 90, true, false, 'Drenagem linfática corporal', 'Spa'),
('Massagem Desportiva', 120, 90, true, false, 'Massagem para atletas', 'Spa'),
('Massagem Relaxante', 120, 90, true, false, 'Massagem relaxante completa', 'Spa'),
('Massagem Podal', 60, 60, true, false, 'Massagem nos pés', 'Spa'),
('Quick Massage', 35, 30, true, false, 'Massagem rápida', 'Spa'),
('Spa dos Pés', 80, 60, true, false, 'Tratamento completo para os pés', 'Spa'),
('Tonalização Barba', 80, 60, true, false, 'Tonalização para barba', 'Coloração'),
('Tonalização Cabelo', 80, 60, true, false, 'Tonalização capilar', 'Coloração'),
('Alisamento + Corte', 140, 90, true, false, 'Alisamento com corte', 'Combo'),
('Alisamento EUA', 100, 60, true, false, 'Alisamento estilo americano', 'Tratamento'),
('Barba + Sobrancelha', 70, 30, true, false, 'Barba com design de sobrancelha', 'Combo'),
('Barba + Tonalização', 110, 60, true, false, 'Barba com tonalização', 'Combo'),
('Barbaterapia', 80, 30, true, false, 'Tratamento especial para barba', 'Barba'),
('Pezinho', 20, 30, true, true, 'Acabamento na nuca', 'Cabelo')
ON CONFLICT DO NOTHING;

-- 2. CONFIGURAÇÕES DO SISTEMA
-- =============================================
INSERT INTO settings (key, value) VALUES
('business_hours', '{"monday": {"open": "09:00", "close": "20:00", "enabled": true}, "tuesday": {"open": "09:00", "close": "20:00", "enabled": true}, "wednesday": {"open": "09:00", "close": "20:00", "enabled": true}, "thursday": {"open": "09:00", "close": "20:00", "enabled": true}, "friday": {"open": "09:00", "close": "20:00", "enabled": true}, "saturday": {"open": "09:00", "close": "18:00", "enabled": true}, "sunday": {"open": "00:00", "close": "00:00", "enabled": false}}'::jsonb),
('shop_info', '{"name": "Barbearia Costa Urbana", "phone": "(11) 99999-9999", "address": "Rua Example, 123", "city": "São Paulo", "state": "SP"}'::jsonb),
('booking_settings', '{"slot_duration": 30, "advance_days": 30, "min_advance_hours": 2}'::jsonb),
('totem_settings', '{"enabled": true, "pin": "1234"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 3. AUTENTICAÇÃO DO TOTEM (PIN: 1234)
-- =============================================
INSERT INTO totem_auth (pin_hash, is_active) VALUES
('$2a$10$rRvHq6Y2BzCz9Gy0fOT2aOEXHbG.ZxJyL6NhU8XQPm0K9FvqL8Wua', true)
ON CONFLICT DO NOTHING;

-- 4. CRIAR STORAGE BUCKET PARA IMAGENS (se não existir)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 
  'images', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 5. POLÍTICAS DE STORAGE
-- =============================================
-- Política para leitura pública
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Política para admins enviarem imagens
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND public.is_admin_or_higher(auth.uid())
);

-- Política para admins atualizarem imagens
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' 
  AND public.is_admin_or_higher(auth.uid())
);

-- Política para admins deletarem imagens
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' 
  AND public.is_admin_or_higher(auth.uid())
);

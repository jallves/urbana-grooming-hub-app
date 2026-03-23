-- Table to link combo services to their individual component services
CREATE TABLE public.combo_service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_service_id uuid NOT NULL REFERENCES painel_servicos(id) ON DELETE CASCADE,
  component_service_id uuid NOT NULL REFERENCES painel_servicos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(combo_service_id, component_service_id)
);

ALTER TABLE public.combo_service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read combo items" ON public.combo_service_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage combo items" ON public.combo_service_items
  FOR ALL USING (is_admin_or_higher(auth.uid()));

-- Populate with existing combos
-- Corte e Barba (4d08d439) = Corte (88147ab2) + Barba (9470c60a)
INSERT INTO combo_service_items (combo_service_id, component_service_id) VALUES
  ('4d08d439-f833-4ab5-b52b-fd5c33b85570', '88147ab2-4f5f-4c88-98dc-226d158523a5'),
  ('4d08d439-f833-4ab5-b52b-fd5c33b85570', '9470c60a-97c7-4275-91d2-b2d58dd0a63a');

-- Corte e Sobrancelha (0e8c39bf) = Corte (88147ab2) + Sobrancelha (8193e8e6)
INSERT INTO combo_service_items (combo_service_id, component_service_id) VALUES
  ('0e8c39bf-2405-42d9-bfb9-8b19238e0c3c', '88147ab2-4f5f-4c88-98dc-226d158523a5'),
  ('0e8c39bf-2405-42d9-bfb9-8b19238e0c3c', '8193e8e6-7db3-42f8-bd27-5ad2b93dedcb');

-- Barba e Sobrancelha (c9b46329) = Barba (9470c60a) + Sobrancelha (8193e8e6)
INSERT INTO combo_service_items (combo_service_id, component_service_id) VALUES
  ('c9b46329-d444-4ce2-b175-82a7c0fe25c1', '9470c60a-97c7-4275-91d2-b2d58dd0a63a'),
  ('c9b46329-d444-4ce2-b175-82a7c0fe25c1', '8193e8e6-7db3-42f8-bd27-5ad2b93dedcb');

-- Corte + Barba + Sobrancelha (3c4cedc0) = Corte + Barba + Sobrancelha
INSERT INTO combo_service_items (combo_service_id, component_service_id) VALUES
  ('3c4cedc0-31b9-4ef3-8a30-2823f4a3aab1', '88147ab2-4f5f-4c88-98dc-226d158523a5'),
  ('3c4cedc0-31b9-4ef3-8a30-2823f4a3aab1', '9470c60a-97c7-4275-91d2-b2d58dd0a63a'),
  ('3c4cedc0-31b9-4ef3-8a30-2823f4a3aab1', '8193e8e6-7db3-42f8-bd27-5ad2b93dedcb');

-- Corte e Tonalização (bc8e8d2c) = Corte (88147ab2) + Tonalização Barba (85b0c1e0)
INSERT INTO combo_service_items (combo_service_id, component_service_id) VALUES
  ('bc8e8d2c-fd01-4648-9a7b-47a62810c7a8', '88147ab2-4f5f-4c88-98dc-226d158523a5'),
  ('bc8e8d2c-fd01-4648-9a7b-47a62810c7a8', '85b0c1e0-6a97-4245-bbf3-bafcb0cf89bf');

-- Barba e Tonalização (aa0e5064) = Barba (9470c60a) + Tonalização Barba (85b0c1e0)
INSERT INTO combo_service_items (combo_service_id, component_service_id) VALUES
  ('aa0e5064-f260-4b87-b65b-02ccac5295d4', '9470c60a-97c7-4275-91d2-b2d58dd0a63a'),
  ('aa0e5064-f260-4b87-b65b-02ccac5295d4', '85b0c1e0-6a97-4245-bbf3-bafcb0cf89bf');
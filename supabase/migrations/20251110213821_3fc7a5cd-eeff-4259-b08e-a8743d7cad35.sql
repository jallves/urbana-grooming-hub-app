
-- ============================================================================
-- MIGRATION 2: Criar tabela de mapeamento entre services e painel_servicos
-- ============================================================================
-- Mantém relação entre IDs das duas tabelas para sincronização

CREATE TABLE IF NOT EXISTS service_id_mapping (
  painel_servicos_id UUID NOT NULL REFERENCES painel_servicos(id) ON DELETE CASCADE,
  services_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (painel_servicos_id, services_id)
);

-- Comentários
COMMENT ON TABLE service_id_mapping IS 
'Mapeamento entre IDs de services e painel_servicos para sincronização automática';

-- Índices para otimizar lookups bidirecionais
CREATE INDEX IF NOT EXISTS idx_mapping_painel_id 
ON service_id_mapping(painel_servicos_id);

CREATE INDEX IF NOT EXISTS idx_mapping_services_id 
ON service_id_mapping(services_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_service_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_mapping_updated_at
BEFORE UPDATE ON service_id_mapping
FOR EACH ROW
EXECUTE FUNCTION update_service_mapping_updated_at();

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela service_id_mapping criada com sucesso';
END $$;

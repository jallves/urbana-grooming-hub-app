-- Adicionar coluna is_active na tabela painel_servicos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'painel_servicos' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE painel_servicos ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END $$;

-- Adicionar coluna descricao na tabela painel_servicos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'painel_servicos' 
        AND column_name = 'descricao'
    ) THEN
        ALTER TABLE painel_servicos ADD COLUMN descricao text;
    END IF;
END $$;

-- Adicionar coluna imagem_url na tabela painel_servicos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'painel_servicos' 
        AND column_name = 'imagem_url'
    ) THEN
        ALTER TABLE painel_servicos ADD COLUMN imagem_url text;
    END IF;
END $$;

-- Garantir que show_on_home existe com valor padrão false
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'painel_servicos' 
        AND column_name = 'show_on_home'
    ) THEN
        ALTER TABLE painel_servicos ADD COLUMN show_on_home boolean DEFAULT false;
    END IF;
END $$;

-- Garantir que display_order existe com valor padrão 0
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'painel_servicos' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE painel_servicos ADD COLUMN display_order integer DEFAULT 0;
    END IF;
END $$;

-- Atualizar políticas RLS para painel_servicos

-- Remover políticas antigas que podem conflitar
DROP POLICY IF EXISTS "Anyone can view services" ON painel_servicos;
DROP POLICY IF EXISTS "Permitir leitura pública de serviços" ON painel_servicos;

-- Política para admins gerenciarem serviços
DROP POLICY IF EXISTS "Admins podem gerenciar servicos" ON painel_servicos;
CREATE POLICY "Admins podem gerenciar servicos"
ON painel_servicos
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Política para todos visualizarem serviços ativos (Totem e público)
CREATE POLICY "Todos podem visualizar servicos ativos"
ON painel_servicos
FOR SELECT
TO public
USING (is_active = true);

-- Atualizar políticas RLS para painel_produtos

-- Garantir que a política de visualização de produtos ativos existe
DROP POLICY IF EXISTS "Todos podem visualizar produtos ativos" ON painel_produtos;
CREATE POLICY "Todos podem visualizar produtos ativos"
ON painel_produtos
FOR SELECT
TO public
USING (is_active = true);

-- Garantir que admins podem gerenciar produtos
DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON painel_produtos;
CREATE POLICY "Admins podem gerenciar produtos"
ON painel_produtos
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_painel_servicos_active ON painel_servicos(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_painel_servicos_show_home ON painel_servicos(show_on_home, display_order) WHERE show_on_home = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_painel_produtos_active ON painel_produtos(is_active) WHERE is_active = true;

-- Comentários para documentação
COMMENT ON COLUMN painel_servicos.is_active IS 'Controla se o serviço está ativo no sistema (Totem e Home)';
COMMENT ON COLUMN painel_servicos.show_on_home IS 'Define se o serviço aparece na Home Page (apenas para marketing/comercial)';
COMMENT ON COLUMN painel_servicos.display_order IS 'Ordem de exibição dos serviços na Home Page (menor número aparece primeiro)';
COMMENT ON COLUMN painel_servicos.descricao IS 'Descrição detalhada do serviço';
COMMENT ON COLUMN painel_servicos.imagem_url IS 'URL da imagem do serviço para exibição';

COMMENT ON COLUMN painel_produtos.is_active IS 'Controla se o produto está ativo e disponível no Totem';
COMMENT ON COLUMN painel_produtos.destaque IS 'Define se o produto aparece em destaque no Totem';
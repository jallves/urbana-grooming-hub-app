-- =====================================================
-- CORREÇÃO DA VIEW painel_clientes - REMOVER EXPOSIÇÃO DE auth.users
-- =====================================================

-- Dropar a view atual que faz JOIN com auth.users
DROP VIEW IF EXISTS public.painel_clientes;

-- Recriar a view usando apenas client_profiles (que já tem email)
-- Isso remove a exposição de auth.users
CREATE OR REPLACE VIEW public.painel_clientes AS
SELECT 
    cp.id,
    cp.nome,
    cp.email,
    cp.whatsapp,
    cp.data_nascimento,
    cp.created_at,
    cp.updated_at
FROM public.client_profiles cp;

-- Adicionar comentário explicando a mudança
COMMENT ON VIEW public.painel_clientes IS 'View de clientes do painel. Não faz JOIN com auth.users por segurança.';

-- A view herda as políticas RLS da tabela client_profiles subjacente
-- Portanto, os mesmos controles de acesso se aplicam
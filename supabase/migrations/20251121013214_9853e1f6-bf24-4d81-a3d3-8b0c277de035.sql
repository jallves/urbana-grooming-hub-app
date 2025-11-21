-- ============================================
-- POLÍTICAS RLS PARA ADMINISTRADORES
-- Garante que admins possam fazer tudo
-- ============================================

-- 1. Habilitar RLS nas tabelas principais (se ainda não estiver)
ALTER TABLE public.painel_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_agendamentos ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "admin_all_painel_clientes" ON public.painel_clientes;
DROP POLICY IF EXISTS "admin_all_painel_barbeiros" ON public.painel_barbeiros;
DROP POLICY IF EXISTS "admin_all_painel_servicos" ON public.painel_servicos;
DROP POLICY IF EXISTS "admin_all_painel_agendamentos" ON public.painel_agendamentos;

-- 3. Criar função para verificar se usuário é admin (se não existir)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- 4. Criar políticas para ADMINISTRADORES terem acesso TOTAL

-- Política para painel_clientes
CREATE POLICY "admin_all_painel_clientes"
ON public.painel_clientes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política para painel_barbeiros
CREATE POLICY "admin_all_painel_barbeiros"
ON public.painel_barbeiros
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política para painel_servicos
CREATE POLICY "admin_all_painel_servicos"
ON public.painel_servicos
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política para painel_agendamentos
CREATE POLICY "admin_all_painel_agendamentos"
ON public.painel_agendamentos
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Comentários explicativos
COMMENT ON POLICY "admin_all_painel_clientes" ON public.painel_clientes IS 
'Administradores têm acesso total para criar, ler, atualizar e deletar clientes';

COMMENT ON POLICY "admin_all_painel_barbeiros" ON public.painel_barbeiros IS 
'Administradores têm acesso total para criar, ler, atualizar e deletar barbeiros';

COMMENT ON POLICY "admin_all_painel_servicos" ON public.painel_servicos IS 
'Administradores têm acesso total para criar, ler, atualizar e deletar serviços';

COMMENT ON POLICY "admin_all_painel_agendamentos" ON public.painel_agendamentos IS 
'Administradores têm acesso total para criar, ler, atualizar e deletar agendamentos';
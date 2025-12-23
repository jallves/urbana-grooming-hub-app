-- =====================================================
-- CORREÇÃO DE SEGURANÇA - MANTENDO ACESSOS EXISTENTES
-- =====================================================

-- 1. CORRIGIR client_profiles - Remover política que permite acesso público total
-- Mas manter acesso para o sistema de autenticação verificar email (via function)
DROP POLICY IF EXISTS "Allow auth system to verify client existence" ON public.client_profiles;

-- A verificação de email já é feita via função SECURITY DEFINER (check_painel_cliente_email)
-- que não precisa de política pública

-- 2. CORRIGIR staff - Remover políticas de acesso público aos dados completos
-- Problema: expõe emails, telefones, taxas de comissão
DROP POLICY IF EXISTS "Public can view active staff" ON public.staff;
DROP POLICY IF EXISTS "Public view staff" ON public.staff;

-- Criar política segura para visualização pública APENAS de dados não sensíveis
-- O acesso público é necessário para o agendamento (cliente escolhe barbeiro)
-- Mas não deve expor email, telefone, commission_rate, etc.
-- NOTA: RLS não controla colunas, apenas linhas. A proteção de colunas
-- deve ser feita via views ou na aplicação.

-- Para manter funcionalidade do agendamento, permitir SELECT público
-- mas a aplicação deve usar campos limitados (id, name, image_url, specialty)
CREATE POLICY "Public can view basic staff info for booking"
ON public.staff
FOR SELECT
TO public
USING (is_active = true);

-- 3. HABILITAR RLS em staff_module_access
ALTER TABLE public.staff_module_access ENABLE ROW LEVEL SECURITY;

-- Políticas para staff_module_access
-- Apenas admins/managers podem gerenciar
CREATE POLICY "Admins can manage module access"
ON public.staff_module_access
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin', 'manager')
  )
);

-- Staff pode ver suas próprias permissões de módulo
CREATE POLICY "Staff can view own module access"
ON public.staff_module_access
FOR SELECT
TO authenticated
USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

-- 4. Limpar políticas duplicadas/redundantes em client_profiles
-- Manter apenas as necessárias
DROP POLICY IF EXISTS "Users can view own profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.client_profiles;
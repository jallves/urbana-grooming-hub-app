-- Migration: Corrigir TODOS os problemas de acesso do master aos dados
-- Parte 1: Habilitar RLS e criar policies para tabelas de métricas

-- =======================
-- ADMIN_METRICS (Dashboard)
-- =======================

-- Habilitar RLS
ALTER TABLE public.admin_metrics ENABLE ROW LEVEL SECURITY;

-- Criar policy para master e admin
CREATE POLICY "Masters and admins can manage admin metrics"
ON public.admin_metrics
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- DASHBOARD_METRICS (Dashboard)
-- =======================

-- Habilitar RLS
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Criar policy para master e admin
CREATE POLICY "Masters and admins can manage dashboard metrics"
ON public.dashboard_metrics
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- LIMPAR POLICIES CONFLITANTES E REDUNDANTES
-- =======================

-- PAINEL_AGENDAMENTOS - Remover policies "Allow all" que podem estar causando problemas
DROP POLICY IF EXISTS "Allow all inserts on painel_agendamentos" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Allow all selects on painel_agendamentos" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Allow all updates on painel_agendamentos" ON public.painel_agendamentos;

-- STAFF - Remover policies antigas que usam is_admin() desatualizado
DROP POLICY IF EXISTS "Admins podem visualizar todos os funcionários" ON public.staff;
DROP POLICY IF EXISTS "Admins podem inserir funcionários" ON public.staff;
DROP POLICY IF EXISTS "Admins podem atualizar funcionários" ON public.staff;
DROP POLICY IF EXISTS "Admins podem deletar funcionários" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage all staff" ON public.staff;
DROP POLICY IF EXISTS "Allow admin full access to staff" ON public.staff;
DROP POLICY IF EXISTS "Allow full access to admin users" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;

-- Garantir que a policy master existe
CREATE POLICY "Masters and admins full access to staff"
ON public.staff
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- PAINEL_BARBEIROS - Remover policy antiga
DROP POLICY IF EXISTS "Anyone can view barbers" ON public.painel_barbeiros;

-- PAINEL_CLIENTES - Remover policies "Allow full access" que podem conflitar
DROP POLICY IF EXISTS "Allow full access to admin users" ON public.painel_clientes;
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.painel_clientes;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.painel_clientes;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.painel_clientes;
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.painel_clientes;
DROP POLICY IF EXISTS "Allow admin full access to clients" ON public.painel_clientes;

-- PAINEL_PRODUTOS - Remover policy confusa
DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON public.painel_produtos;

-- =======================
-- GARANTIR TABELAS DE AUDITORIA E LOG
-- =======================

-- AUDIT_LOG
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters and admins can manage audit log"
ON public.audit_log
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- ADMIN_ACTIVITY_LOG
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters and admins can manage activity log"
ON public.admin_activity_log
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- =======================
-- OUTRAS TABELAS IMPORTANTES
-- =======================

-- CONFIGURATION_BACKUPS
ALTER TABLE public.configuration_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters and admins can manage backups"
ON public.configuration_backups
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- DASHBOARD_WIDGETS
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters and admins can manage widgets"
ON public.dashboard_widgets
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- CLIENT_REVIEWS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters and admins can manage reviews"
ON public.client_reviews
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Public can view published reviews"
ON public.client_reviews
FOR SELECT
TO public
USING (is_published = true);
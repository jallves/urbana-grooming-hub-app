-- =====================================================
-- HABILITAR RLS EM TABELAS PÚBLICAS
-- =====================================================

-- 1. MARKETING_CAMPAIGNS - Apenas admins podem gerenciar
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active campaigns"
ON public.marketing_campaigns
FOR SELECT
TO public
USING (status = 'active');

CREATE POLICY "Admins can manage campaigns"
ON public.marketing_campaigns
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

-- 2. NAVIGATION_MENU - Público pode ver itens ativos, admins gerenciam
ALTER TABLE public.navigation_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu items"
ON public.navigation_menu
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage navigation menu"
ON public.navigation_menu
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
);

-- 3. PRODUCTS - Público pode ver produtos ativos, admins gerenciam
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage products"
ON public.products
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

-- 4. SCHEDULED_TASKS - Apenas admins podem gerenciar tarefas agendadas
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled tasks"
ON public.scheduled_tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
);

-- 5. SERVICE_ID_MAPPING - Tabela de mapeamento interno
ALTER TABLE public.service_id_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage service id mapping"
ON public.service_id_mapping
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
);

-- Permitir leitura pública para sincronização de serviços
CREATE POLICY "Public can view service mapping"
ON public.service_id_mapping
FOR SELECT
TO public
USING (true);

-- 6. SUPPORT_TICKETS - Clientes veem seus tickets, admins veem todos
-- NOTA: A tabela usa client_id, não user_id
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can create tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets
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
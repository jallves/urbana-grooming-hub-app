-- Migration: Garantir acesso master a TODAS as tabelas restantes
-- Parte 2: Tabelas adicionais que podem estar bloqueando dados

-- =======================
-- CONTACT_MESSAGES
-- =======================
CREATE POLICY "Masters and admins can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters and admins can manage contact messages"
ON public.contact_messages
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
-- DISCOUNT_COUPONS
-- =======================
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters and admins can manage coupons"
ON public.discount_coupons
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

CREATE POLICY "Public can view active coupons"
ON public.discount_coupons
FOR SELECT
TO public
USING (is_active = true);

-- =======================
-- BARBER_AVAILABILITY
-- =======================
ALTER TABLE public.barber_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters and admins can manage availability"
ON public.barber_availability
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

CREATE POLICY "Public can view availability"
ON public.barber_availability
FOR SELECT
TO public
USING (true);

-- =======================
-- VENDAS (importante para relatórios)
-- =======================
CREATE POLICY "Masters and admins can view all sales"
ON public.vendas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters and admins can manage sales"
ON public.vendas
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
-- VENDAS_ITENS
-- =======================
CREATE POLICY "Masters and admins can view sales items"
ON public.vendas_itens
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters and admins can manage sales items"
ON public.vendas_itens
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
-- TOTEM_SESSIONS
-- =======================
CREATE POLICY "Masters and admins can view totem sessions"
ON public.totem_sessions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters and admins can manage totem sessions"
ON public.totem_sessions
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
-- TOTEM_PAYMENTS
-- =======================
CREATE POLICY "Masters and admins can view totem payments"
ON public.totem_payments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters and admins can manage totem payments"
ON public.totem_payments
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
-- PAGAMENTOS (sistema de pagamentos)
-- =======================
CREATE POLICY "Masters and admins can view all payments"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Masters and admins can manage payments"
ON public.pagamentos
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
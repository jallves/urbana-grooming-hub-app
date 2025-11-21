-- Migration: Garantir acesso TOTAL do master a TODOS os módulos do sistema
-- Parte 1: Dropar policies antigas e atualizar função is_admin()

-- =======================
-- DROPAR POLICIES QUE USAM is_admin()
-- =======================

DROP POLICY IF EXISTS "admin_all_painel_clientes" ON public.painel_clientes;
DROP POLICY IF EXISTS "admin_all_painel_barbeiros" ON public.painel_barbeiros;
DROP POLICY IF EXISTS "admin_all_painel_servicos" ON public.painel_servicos;
DROP POLICY IF EXISTS "admin_all_painel_agendamentos" ON public.painel_agendamentos;

-- Dropar outras policies antigas
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;
DROP POLICY IF EXISTS "Admins and managers can view employees" ON public.employees;
DROP POLICY IF EXISTS "Admins podem gerenciar staff" ON public.staff;
DROP POLICY IF EXISTS "Admin pode gerenciar staff" ON public.staff;
DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON public.painel_produtos;
DROP POLICY IF EXISTS "Admins podem gerenciar servicos" ON public.painel_servicos;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banner_images;
DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can manage photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can manage business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage working hours" ON public.working_hours;

-- =======================
-- ATUALIZAR FUNÇÃO is_admin() COM CASCADE
-- =======================

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('master', 'admin')
  );
$$;

-- =======================
-- RECRIAR TODAS AS POLICIES COM SUPORTE A MASTER
-- =======================

-- EMPLOYEES (Funcionários)
CREATE POLICY "Masters and admins can manage employees"
ON public.employees
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

CREATE POLICY "Managers can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- STAFF
CREATE POLICY "Masters and admins can manage staff"
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

-- PAINEL_BARBEIROS (Barbeiros)
CREATE POLICY "Masters and admins can manage barbers"
ON public.painel_barbeiros
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

-- PAINEL_PRODUTOS (Produtos)
CREATE POLICY "Masters and admins can manage products"
ON public.painel_produtos
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

-- PAINEL_SERVICOS (Serviços)
CREATE POLICY "Masters and admins can manage services"
ON public.painel_servicos
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

-- PAINEL_CLIENTES (Clientes)
CREATE POLICY "Masters and admins can manage clients"
ON public.painel_clientes
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

-- PAINEL_AGENDAMENTOS (Agendamentos)
CREATE POLICY "Masters and admins can manage appointments"
ON public.painel_agendamentos
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

-- BANNER_IMAGES (Gestão do Site)
CREATE POLICY "Masters and admins can manage banners"
ON public.banner_images
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

-- GALLERY_IMAGES (Gestão do Site - Galeria)
CREATE POLICY "Masters and admins can manage gallery"
ON public.gallery_images
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

-- GALLERY_PHOTOS (Gestão do Site - Fotos)
CREATE POLICY "Masters and admins can manage photos"
ON public.gallery_photos
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

-- FAQS (Gestão do Site - FAQs)
CREATE POLICY "Masters and admins can manage faqs"
ON public.faqs
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

-- BUSINESS_HOURS (Configurações)
CREATE POLICY "Masters and admins can manage business hours"
ON public.business_hours
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

-- ADMIN_USERS (Configurações - Usuários Admin)
CREATE POLICY "Masters and admins can manage admin users"
ON public.admin_users
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

-- WORKING_HOURS (Horários de Trabalho)
CREATE POLICY "Masters and admins can manage working hours"
ON public.working_hours
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
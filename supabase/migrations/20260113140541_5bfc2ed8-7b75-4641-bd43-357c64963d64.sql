
-- =============================================
-- BARBEARIA COSTA URBANA - DATABASE SETUP
-- =============================================

-- 1. ENUMS
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'manager', 'barber', 'user');
  END IF;
END $$;

-- 2. CORE TABLES
-- =============================================

-- User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Staff/Barbers Table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'barber',
  photo_url TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 50.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Painel Barbeiros (mirror for admin panel)
CREATE TABLE IF NOT EXISTS public.painel_barbeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  telefone TEXT,
  foto_url TEXT,
  taxa_comissao NUMERIC(5,2) DEFAULT 50.00,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Painel Clientes (admin panel clients)
CREATE TABLE IF NOT EXISTS public.painel_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  pin_hash TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Services Table
CREATE TABLE IF NOT EXISTS public.painel_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  duracao INTEGER NOT NULL, -- in minutes
  categoria TEXT,
  ativo BOOLEAN DEFAULT true,
  exibir_home BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.painel_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  estoque INTEGER DEFAULT 0,
  categoria TEXT,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.painel_servicos(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Painel Agendamentos (admin panel appointments)
CREATE TABLE IF NOT EXISTS public.painel_agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.painel_clientes(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES public.painel_servicos(id) ON DELETE SET NULL,
  barbeiro_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status TEXT DEFAULT 'agendado',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  painel_servicos JSONB,
  painel_barbeiros JSONB,
  painel_clientes JSONB
);

-- Working Hours Table
CREATE TABLE IF NOT EXISTS public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);

-- 3. FINANCIAL TABLES
-- =============================================

-- Sales Table
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.painel_clientes(id) ON DELETE SET NULL,
  barbeiro_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE SET NULL,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(10,2) DEFAULT 0,
  gorjeta NUMERIC(10,2) DEFAULT 0,
  forma_pagamento TEXT,
  status TEXT DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sales Items Table
CREATE TABLE IF NOT EXISTS public.vendas_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL, -- 'servico' or 'produto'
  item_id UUID NOT NULL,
  nome TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  barbeiro_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Records Table
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'revenue', 'expense', 'commission', 'tip_received', 'tip_payable'
  category TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  reference_id UUID,
  reference_type TEXT,
  barber_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.painel_servicos(id) ON DELETE SET NULL,
  due_date DATE,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Barber Commissions Table
CREATE TABLE IF NOT EXISTS public.barber_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE CASCADE NOT NULL,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  valor NUMERIC(10,2) NOT NULL,
  tipo TEXT DEFAULT 'servico', -- 'servico', 'produto', 'gorjeta'
  status TEXT DEFAULT 'pendente', -- 'pendente', 'pago'
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cash Flow Table
CREATE TABLE IF NOT EXISTS public.cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'entrada', 'saida'
  category TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TOTEM SYSTEM TABLES
-- =============================================

-- Totem Auth Table
CREATE TABLE IF NOT EXISTS public.totem_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Totem Sessions Table
CREATE TABLE IF NOT EXISTS public.totem_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  totem_auth_id UUID REFERENCES public.totem_auth(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Totem Payments Table
CREATE TABLE IF NOT EXISTS public.totem_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ADMIN TABLES
-- =============================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin Activity Log Table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Staff Module Access Table
CREATE TABLE IF NOT EXISTS public.staff_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(staff_id, module_id)
);

-- Gallery Images Table
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  src TEXT NOT NULL,
  alt TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totem_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totem_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totem_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- 7. SECURITY DEFINER FUNCTIONS
-- =============================================

-- Has Role Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Check if user is admin or higher
CREATE OR REPLACE FUNCTION public.is_admin_or_higher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('master', 'admin', 'manager')
  );
$$;

-- Get Staff Module Access
CREATE OR REPLACE FUNCTION public.get_staff_module_access(staff_id_param UUID)
RETURNS TEXT[] AS $$
DECLARE
  modules TEXT[];
BEGIN
  SELECT array_agg(module_id) INTO modules
  FROM staff_module_access
  WHERE staff_id = staff_id_param;
  
  RETURN COALESCE(modules, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Staff Module Access
CREATE OR REPLACE FUNCTION public.update_staff_module_access(
  staff_id_param UUID,
  module_ids_param TEXT[]
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM staff_module_access WHERE staff_id = staff_id_param;
  
  IF module_ids_param IS NOT NULL AND array_length(module_ids_param, 1) > 0 THEN
    INSERT INTO staff_module_access (staff_id, module_id)
    SELECT staff_id_param, unnest(module_ids_param);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Public Client
CREATE OR REPLACE FUNCTION public.create_public_client(
  client_name TEXT,
  client_phone TEXT, 
  client_email TEXT
) RETURNS uuid 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id uuid;
BEGIN
  SELECT id INTO client_id 
  FROM public.clients
  WHERE phone = client_phone
  LIMIT 1;
  
  IF client_id IS NULL THEN
    INSERT INTO public.clients (name, phone, email)
    VALUES (client_name, client_phone, client_email)
    RETURNING id INTO client_id;
  END IF;
  
  RETURN client_id;
END;
$$;

-- Create Public Appointment
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_client_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_notes text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_id uuid;
BEGIN
  INSERT INTO public.appointments (
    client_id,
    service_id,
    staff_id,
    start_time,
    end_time,
    status,
    notes
  ) VALUES (
    p_client_id,
    p_service_id,
    p_staff_id,
    p_start_time,
    p_end_time,
    'scheduled',
    p_notes
  )
  RETURNING id INTO appointment_id;
  
  RETURN appointment_id;
END;
$$;

-- 8. RLS POLICIES
-- =============================================

-- User Roles Policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  USING (public.is_admin_or_higher(auth.uid()));

-- Staff Policies (public read for booking, restricted write)
CREATE POLICY "Public can read active staff" ON public.staff
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage staff" ON public.staff
  USING (public.is_admin_or_higher(auth.uid()));

-- Painel Barbeiros Policies
CREATE POLICY "Public can read active barbers" ON public.painel_barbeiros
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage barbers" ON public.painel_barbeiros
  USING (public.is_admin_or_higher(auth.uid()));

-- Services Policies (public read for booking)
CREATE POLICY "Public can read active services" ON public.painel_servicos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage services" ON public.painel_servicos
  USING (public.is_admin_or_higher(auth.uid()));

-- Products Policies
CREATE POLICY "Public can read active products" ON public.painel_produtos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage products" ON public.painel_produtos
  USING (public.is_admin_or_higher(auth.uid()));

-- Clients Policies
CREATE POLICY "Admins can manage clients" ON public.clients
  USING (public.is_admin_or_higher(auth.uid()));

-- Painel Clientes Policies
CREATE POLICY "Users can view own client data" ON public.painel_clientes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own client data" ON public.painel_clientes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all clients" ON public.painel_clientes
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Allow public insert for totem" ON public.painel_clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select for totem" ON public.painel_clientes
  FOR SELECT USING (true);

-- Appointments Policies
CREATE POLICY "Public can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage appointments" ON public.appointments
  USING (public.is_admin_or_higher(auth.uid()));

-- Painel Agendamentos Policies
CREATE POLICY "Public can read appointments" ON public.painel_agendamentos
  FOR SELECT USING (true);

CREATE POLICY "Public can create appointments" ON public.painel_agendamentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage appointments" ON public.painel_agendamentos
  USING (public.is_admin_or_higher(auth.uid()));

-- Working Hours Policies
CREATE POLICY "Public can read working hours" ON public.working_hours
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage working hours" ON public.working_hours
  USING (public.is_admin_or_higher(auth.uid()));

-- Sales Policies
CREATE POLICY "Public can create sales (totem)" ON public.vendas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage sales" ON public.vendas
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Public can read sales" ON public.vendas
  FOR SELECT USING (true);

-- Sales Items Policies
CREATE POLICY "Public can create sales items (totem)" ON public.vendas_itens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage sales items" ON public.vendas_itens
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Public can read sales items" ON public.vendas_itens
  FOR SELECT USING (true);

-- Financial Records Policies
CREATE POLICY "Admins can manage financial records" ON public.financial_records
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Barbers can view own financial records" ON public.financial_records
  FOR SELECT USING (
    barber_id IN (
      SELECT pb.id FROM public.painel_barbeiros pb
      JOIN public.staff s ON s.email = pb.email
      JOIN auth.users u ON u.email = s.email
      WHERE u.id = auth.uid()
    )
  );

-- Barber Commissions Policies
CREATE POLICY "Admins can manage commissions" ON public.barber_commissions
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Barbers can view own commissions" ON public.barber_commissions
  FOR SELECT USING (
    barber_id IN (
      SELECT pb.id FROM public.painel_barbeiros pb
      JOIN auth.users u ON u.email = pb.email
      WHERE u.id = auth.uid()
    )
  );

-- Cash Flow Policies
CREATE POLICY "Admins can manage cash flow" ON public.cash_flow
  USING (public.is_admin_or_higher(auth.uid()));

-- Totem Auth Policies
CREATE POLICY "Public can read totem auth" ON public.totem_auth
  FOR SELECT USING (true);

-- Totem Sessions Policies
CREATE POLICY "Public can manage totem sessions" ON public.totem_sessions
  USING (true);

-- Totem Payments Policies
CREATE POLICY "Public can manage totem payments" ON public.totem_payments
  USING (true);

-- Admin Users Policies
CREATE POLICY "Admins can manage admin users" ON public.admin_users
  USING (public.is_admin_or_higher(auth.uid()));

-- Admin Activity Log Policies
CREATE POLICY "Admins can read activity log" ON public.admin_activity_log
  FOR SELECT USING (public.is_admin_or_higher(auth.uid()));

-- Staff Module Access Policies
CREATE POLICY "Admins can manage staff module access" ON public.staff_module_access
  USING (public.is_admin_or_higher(auth.uid()));

-- Gallery Images Policies
CREATE POLICY "Public can read gallery images" ON public.gallery_images
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage gallery images" ON public.gallery_images
  USING (public.is_admin_or_higher(auth.uid()));

-- 9. GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

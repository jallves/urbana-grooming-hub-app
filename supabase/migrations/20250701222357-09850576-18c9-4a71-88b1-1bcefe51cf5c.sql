
-- Criar tabela employees
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'barber')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone
);

-- Habilitar RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Política para administradores gerenciarem funcionários
CREATE POLICY "Admins can manage all employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Política para funcionários verem próprios dados
CREATE POLICY "Employees can view own data"
ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Adicionar 'manager' ao enum app_role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'barber', 'user', 'customer');
    ELSE
        BEGIN
            ALTER TYPE public.app_role ADD VALUE 'manager';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at_trigger
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();


-- Criação da nova tabela staff_sequencial com id sequencial (serial)
CREATE TABLE public.staff_sequencial (
  id SERIAL PRIMARY KEY,
  uuid_id UUID, -- campo opcional para preservar antigo id para migração
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'barber',
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  specialties TEXT,
  experience TEXT,
  commission_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionando um índice único no email (opcional, remova se pode haver duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS staff_sequencial_email_idx ON public.staff_sequencial (email);

-- Pronto para migrar dados antigos para cá depois!

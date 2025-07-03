
-- First, let's add the missing columns to painel_barbeiros to match staff table
ALTER TABLE public.painel_barbeiros 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'barber',
ADD COLUMN IF NOT EXISTS staff_id UUID;

-- Add foreign key reference to staff table
ALTER TABLE public.painel_barbeiros 
ADD CONSTRAINT fk_painel_barbeiros_staff 
FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

-- Insert data from staff table where role is 'barber'
INSERT INTO public.painel_barbeiros (
  nome, 
  email, 
  telefone, 
  image_url, 
  specialties, 
  experience, 
  commission_rate, 
  is_active, 
  role, 
  staff_id,
  created_at, 
  updated_at
)
SELECT 
  s.name as nome,
  s.email,
  s.phone as telefone,
  s.image_url,
  s.specialties,
  s.experience,
  s.commission_rate,
  s.is_active,
  s.role,
  s.id as staff_id,
  s.created_at,
  s.updated_at
FROM public.staff s
WHERE s.role = 'barber' 
  AND s.is_active = true
  AND s.id NOT IN (
    SELECT staff_id 
    FROM public.painel_barbeiros 
    WHERE staff_id IS NOT NULL
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_painel_barbeiros_staff_id ON public.painel_barbeiros(staff_id);
CREATE INDEX IF NOT EXISTS idx_painel_barbeiros_active ON public.painel_barbeiros(is_active);

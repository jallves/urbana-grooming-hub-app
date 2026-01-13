
-- Add missing columns to tables

-- 1. Marketing campaigns
ALTER TABLE public.marketing_campaigns
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2);

-- 2. Discount coupons 
ALTER TABLE public.discount_coupons
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

-- 3. Add name column to barber_commissions for direct barber name storage
ALTER TABLE public.barber_commissions
ADD COLUMN IF NOT EXISTS barber_name TEXT;

-- 4. Add services relationship table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
  USING (public.is_admin_or_higher(auth.uid()));

-- 5. Add foreign key from appointments to services
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_fk UUID REFERENCES public.services(id) ON DELETE SET NULL;

-- 6. Totem sessions relationship
CREATE TABLE IF NOT EXISTS public.appointment_totem_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL,
  totem_session_id UUID REFERENCES public.totem_sessions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.appointment_totem_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage appointment_totem_sessions" ON public.appointment_totem_sessions
  USING (true);

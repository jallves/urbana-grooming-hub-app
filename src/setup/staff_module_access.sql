
-- Create table to store module access permissions for staff
CREATE TABLE IF NOT EXISTS public.staff_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(staff_id, module_id)
);

-- Add RLS policies
ALTER TABLE public.staff_module_access ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to manage all records
CREATE POLICY "Admins can manage staff module access"
  ON public.staff_module_access
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy to allow staff to read their own module access
CREATE POLICY "Staff can read their own module access"
  ON public.staff_module_access
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth.users.id 
      FROM auth.users 
      JOIN staff ON staff.email = auth.users.email
      WHERE staff.id = staff_module_access.staff_id
    )
  );

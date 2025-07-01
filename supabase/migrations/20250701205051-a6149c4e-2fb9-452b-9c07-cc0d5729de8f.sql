
-- Allow clients to view active staff members for appointment booking
CREATE POLICY "Clients can view active staff for booking"
ON public.staff
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow public access to view active staff members (for public booking)
CREATE POLICY "Public can view active staff for booking"
ON public.staff
FOR SELECT
TO anon
USING (is_active = true);

-- Enable public read access for staff table
CREATE POLICY "Enable read access for all users"
ON public.staff
FOR SELECT
USING (true);

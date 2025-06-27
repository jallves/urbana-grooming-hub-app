
-- Create RLS policy to allow public read access to active barbers for appointment booking
CREATE POLICY "Allow public read access to active barbers" 
ON public.barbers 
FOR SELECT 
USING (is_active = true);

-- Create RLS policy to allow public read access to active services for appointment booking  
CREATE POLICY "Allow public read access to active services"
ON public.services
FOR SELECT 
USING (is_active = true);

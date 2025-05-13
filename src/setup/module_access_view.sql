
-- Create a view that joins staff with their module access rights
CREATE OR REPLACE VIEW public.staff_with_modules AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.role,
  s.is_active,
  COALESCE(ma.module_ids, ARRAY[]::text[]) as module_access
FROM 
  public.staff s
LEFT JOIN
  public.staff_module_access ma ON s.id = ma.staff_id;

-- Grant appropriate permissions
GRANT SELECT ON public.staff_with_modules TO authenticated;

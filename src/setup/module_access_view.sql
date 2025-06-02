-- View otimizada para listar staff com direitos de acesso a módulos
CREATE OR REPLACE VIEW public.staff_with_modules AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.role,
  s.is_active,
  COALESCE(
    array_agg(DISTINCT ma.module_id ORDER BY ma.module_id), 
    ARRAY[]::text[]
  ) AS module_access
FROM 
  public.staff s
LEFT JOIN public.staff_module_access ma 
  ON s.id = ma.staff_id
GROUP BY s.id, s.name, s.email, s.role, s.is_active;

-- Permissões otimizadas
GRANT SELECT ON public.staff_with_modules TO authenticated;
COMMENT ON VIEW public.staff_with_modules IS 'Lista de funcionários com direitos de acesso a módulos';

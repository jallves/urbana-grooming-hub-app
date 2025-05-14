
-- Function to get module access for a staff member
CREATE OR REPLACE FUNCTION public.get_staff_module_access(staff_id_param UUID)
RETURNS TEXT[] AS $$
DECLARE
  result TEXT[];
BEGIN
  SELECT module_ids INTO result
  FROM staff_module_access
  WHERE staff_id = staff_id_param;
  
  -- Return empty array if no access found
  RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update module access for a staff member
CREATE OR REPLACE FUNCTION public.update_staff_module_access(
  staff_id_param UUID,
  module_ids_param TEXT[]
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO staff_module_access (staff_id, module_ids, updated_at)
  VALUES (staff_id_param, module_ids_param, NOW())
  ON CONFLICT (staff_id)
  DO UPDATE SET
    module_ids = module_ids_param,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_staff_module_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_staff_module_access TO authenticated;

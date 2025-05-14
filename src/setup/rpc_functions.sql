
-- Function to get module access for a staff member
CREATE OR REPLACE FUNCTION public.get_staff_module_access(staff_id_param UUID)
RETURNS TEXT[] AS $$
DECLARE
  modules TEXT[];
BEGIN
  SELECT array_agg(module_id) INTO modules
  FROM staff_module_access
  WHERE staff_id = staff_id_param;
  
  RETURN COALESCE(modules, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update module access for a staff member
CREATE OR REPLACE FUNCTION public.update_staff_module_access(
  staff_id_param UUID,
  module_ids_param TEXT[]
)
RETURNS VOID AS $$
BEGIN
  -- Delete existing access
  DELETE FROM staff_module_access WHERE staff_id = staff_id_param;
  
  -- Insert new access
  IF module_ids_param IS NOT NULL AND array_length(module_ids_param, 1) > 0 THEN
    INSERT INTO staff_module_access (staff_id, module_id)
    SELECT staff_id_param, unnest(module_ids_param);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_staff_module_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_staff_module_access TO authenticated;

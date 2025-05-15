
import { supabase } from '@/integrations/supabase/client';

export const supabaseRPC = {
  getStaffModuleAccess: async (staffId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_staff_module_access', {
        staff_id_param: staffId
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in getStaffModuleAccess RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to get staff module access') 
      };
    }
  },
  
  updateStaffModuleAccess: async (staffId: string, moduleIds: string[]) => {
    try {
      const { data, error } = await supabase.rpc('update_staff_module_access', {
        staff_id_param: staffId,
        module_ids_param: moduleIds
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in updateStaffModuleAccess RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to update staff module access') 
      };
    }
  }
};

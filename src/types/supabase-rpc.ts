
import { supabase } from '@/integrations/supabase/client';

// Define allowed RPC function names for better type safety
type RpcFunctionName = 
  | 'get_staff_module_access'
  | 'update_staff_module_access'
  | 'add_barber_user'
  | 'has_role'
  | 'get_available_time_slots';

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
  },

  getAvailableTimeSlots: async (staffId: string, date: string, serviceDuration: number) => {
    try {
      const { data, error } = await supabase.rpc('get_available_time_slots', {
        p_staff_id: staffId,
        p_date: date,
        p_service_duration: serviceDuration
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in getAvailableTimeSlots RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to get available time slots') 
      };
    }
  }
};

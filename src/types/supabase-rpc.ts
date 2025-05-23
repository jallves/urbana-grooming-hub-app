
import { supabase } from '@/integrations/supabase/client';

// Define allowed RPC function names for better type safety
type RpcFunctionName = 
  | 'get_staff_module_access'
  | 'update_staff_module_access'
  | 'create_public_client'
  | 'create_public_appointment'
  | 'add_barber_user'
  | 'has_role';

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
  
  createPublicClient: async (clientName: string, clientPhone: string, clientEmail: string | null) => {
    try {
      // Use type assertion with 'as any' to bypass TypeScript constraint
      const { data, error } = await (supabase.rpc as any)('create_public_client', {
        client_name: clientName,
        client_phone: clientPhone, 
        client_email: clientEmail
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in createPublicClient RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to create or find client') 
      };
    }
  },
  
  createPublicAppointment: async (
    clientId: string,
    serviceId: string,
    staffId: string | null,
    startTime: string,
    endTime: string,
    notes: string | null
  ) => {
    try {
      // Use type assertion with 'as any' to bypass TypeScript constraint
      const { data, error } = await (supabase.rpc as any)('create_public_appointment', {
        p_client_id: clientId,
        p_service_id: serviceId,
        p_staff_id: staffId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_notes: notes
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in createPublicAppointment RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to create appointment') 
      };
    }
  }
};

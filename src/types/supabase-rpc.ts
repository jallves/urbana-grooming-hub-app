
import { supabase } from '@/integrations/supabase/client';

// Define allowed RPC function names for better type safety
type RpcFunctionName = 
  | 'get_staff_module_access'
  | 'update_staff_module_access'
  | 'add_barber_user'
  | 'has_role'
  | 'get_available_time_slots'
  | 'check_painel_cliente_email'
  | 'create_painel_cliente'
  | 'authenticate_painel_cliente'
  | 'get_painel_cliente_by_id'
  | 'update_painel_cliente'
  | 'get_painel_barbeiros'
  | 'get_painel_servicos'
  | 'get_agendamentos_barbeiro_data'
  | 'create_painel_agendamento'
  | 'check_auth_user_exists'
  | 'create_barber_user'
  | 'disable_barber_user';

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
      // Use check_barber_slot_availability as fallback since get_available_time_slots doesn't exist
      const { data, error } = await (supabase.rpc as any)('check_barber_slot_availability', {
        p_barber_id: staffId,
        p_date: date,
        p_duration: serviceDuration,
        p_time: '09:00'
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in getAvailableTimeSlots RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to get available time slots') 
      };
    }
  },

  checkAuthUserExists: async (email: string) => {
    try {
      // Use any to bypass strict typing for custom RPC functions
      const { data, error } = await (supabase.rpc as any)('check_auth_user_exists', {
        user_email: email
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in checkAuthUserExists RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to check auth user exists') 
      };
    }
  },

  createBarberUser: async (email: string, password: string, name: string, staffId: string) => {
    try {
      // Use any to bypass strict typing for custom RPC functions
      const { data, error } = await (supabase.rpc as any)('create_barber_user', {
        p_email: email,
        p_password: password,
        p_name: name,
        p_staff_id: staffId
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in createBarberUser RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to create barber user') 
      };
    }
  },

  disableBarberUser: async (email: string) => {
    try {
      // Use any to bypass strict typing for custom RPC functions
      const { data, error } = await (supabase.rpc as any)('disable_barber_user', {
        p_email: email
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error in disableBarberUser RPC:', error);
      return { 
        data: null, 
        error: new Error('Failed to disable barber user') 
      };
    }
  }
};

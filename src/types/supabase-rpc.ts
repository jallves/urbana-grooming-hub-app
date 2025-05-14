
import { supabase } from "@/integrations/supabase/client";

// Response types for custom RPC functions
export interface GetStaffModuleAccessResponse {
  data: string[] | null;
  error: Error | null;
}

export interface UpdateStaffModuleAccessResponse {
  data: null;
  error: Error | null;
}

// Create a type-safe wrapper for our custom RPC functions
export const supabaseRPC = {
  getStaffModuleAccess: async (staffId: string): Promise<GetStaffModuleAccessResponse> => {
    const { data, error } = await supabase.rpc(
      'get_staff_module_access' as any, 
      { staff_id_param: staffId }
    );
    
    return { data, error } as GetStaffModuleAccessResponse;
  },
  
  updateStaffModuleAccess: async (staffId: string, moduleIds: string[]): Promise<UpdateStaffModuleAccessResponse> => {
    const { data, error } = await supabase.rpc(
      'update_staff_module_access' as any, 
      { 
        staff_id_param: staffId,
        module_ids_param: moduleIds
      }
    );
    
    return { data, error } as UpdateStaffModuleAccessResponse;
  }
};

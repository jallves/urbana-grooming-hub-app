
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
  getStaffModuleAccess: (staffId: string) => {
    return supabase.rpc(
      'get_staff_module_access' as any, 
      { staff_id_param: staffId }
    ) as unknown as Promise<GetStaffModuleAccessResponse>;
  },
  updateStaffModuleAccess: (staffId: string, moduleIds: string[]) => {
    return supabase.rpc(
      'update_staff_module_access' as any, 
      { 
        staff_id_param: staffId,
        module_ids_param: moduleIds
      }
    ) as unknown as Promise<UpdateStaffModuleAccessResponse>;
  }
};

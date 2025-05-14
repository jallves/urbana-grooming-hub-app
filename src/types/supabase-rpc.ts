
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
    try {
      console.log('Fetching module access for staff:', staffId);
      
      const { data, error } = await supabase
        .from('staff_module_access')
        .select('module_id')
        .eq('staff_id', staffId);
      
      if (error) {
        console.error('Error in getStaffModuleAccess:', error);
        return { data: null, error };
      }
      
      // Transform the array of objects to an array of module_ids
      const moduleIds = data ? data.map(item => item.module_id) : [];
      console.log('Module access retrieved:', moduleIds);
      
      return { data: moduleIds, error: null };
    } catch (err) {
      console.error('Exception in getStaffModuleAccess:', err);
      return { data: null, error: err as Error };
    }
  },
  
  updateStaffModuleAccess: async (staffId: string, moduleIds: string[]): Promise<UpdateStaffModuleAccessResponse> => {
    try {
      console.log('Updating module access for staff:', staffId, 'modules:', moduleIds);
      
      // First, delete existing module access for this staff
      const { error: deleteError } = await supabase
        .from('staff_module_access')
        .delete()
        .eq('staff_id', staffId);
      
      if (deleteError) {
        console.error('Error deleting existing module access:', deleteError);
        return { data: null, error: deleteError };
      }
      
      // Then insert new module access entries
      if (moduleIds.length > 0) {
        const modulesToInsert = moduleIds.map(moduleId => ({
          staff_id: staffId,
          module_id: moduleId
        }));
        
        const { error: insertError } = await supabase
          .from('staff_module_access')
          .insert(modulesToInsert);
        
        if (insertError) {
          console.error('Error inserting module access:', insertError);
          return { data: null, error: insertError };
        }
      }
      
      console.log('Module access updated successfully');
      return { data: null, error: null };
    } catch (err) {
      console.error('Exception in updateStaffModuleAccess:', err);
      return { data: null, error: err as Error };
    }
  }
};

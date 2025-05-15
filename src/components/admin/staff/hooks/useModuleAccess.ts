
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseRPC } from '@/types/supabase-rpc';

export const useModuleAccess = (requiredModuleId?: string) => {
  const { user, isAdmin } = useAuth();
  const [moduleAccess, setModuleAccess] = useState<string[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchModuleAccess = async () => {
      console.log('useModuleAccess - Checking access for module:', requiredModuleId);
      console.log('useModuleAccess - User data:', user?.id, 'isAdmin:', isAdmin);
      
      // Admin has access to everything
      if (isAdmin) {
        console.log('useModuleAccess - User is admin, granting full access');
        const allModules = ['admin', 'appointments', 'clients', 'services', 'reports'];
        setModuleAccess(allModules);
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // If no user, they don't have access
      if (!user) {
        console.log('useModuleAccess - No user, denying access');
        setModuleAccess([]);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        // Check if the user has a barber role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'barber')
          .maybeSingle();

        if (roleError) {
          console.error('useModuleAccess - Error checking barber role:', roleError);
          setModuleAccess([]);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        if (!roleData) {
          console.log('useModuleAccess - User is not a barber');
          setModuleAccess([]);
          setHasAccess(false);
          setLoading(false);
          return;
        }
        
        console.log('useModuleAccess - User is a barber, checking staff record');

        // First, get the staff record for this user
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (staffError || !staffData) {
          console.error('useModuleAccess - Staff record not found:', staffError || 'No record');
          // If staff record not found, check directly by user ID
          const { data: directModules, error: directError } = await supabase
            .from('staff_module_access')
            .select('module_id')
            .eq('staff_id', user.id);
            
          if (directError) {
            console.error('useModuleAccess - Error finding direct modules:', directError);
            setModuleAccess([]);
            setHasAccess(false);
          } else if (directModules && directModules.length > 0) {
            const modules = directModules.map(item => item.module_id);
            console.log('useModuleAccess - Direct modules retrieved:', modules);
            setModuleAccess(modules);
            setHasAccess(requiredModuleId ? modules.includes(requiredModuleId) : true);
          } else {
            // Default access - all barbers get these modules by default
            const defaultModules = ['appointments', 'reports'];
            console.log('useModuleAccess - Using default modules:', defaultModules);
            setModuleAccess(defaultModules);
            setHasAccess(requiredModuleId ? defaultModules.includes(requiredModuleId) : true);
          }
          setLoading(false);
          return;
        }

        console.log('useModuleAccess - Found staff record:', staffData.id);
        
        // Get module access for this staff member
        const response = await supabaseRPC.getStaffModuleAccess(staffData.id);

        if (response.error) {
          console.error('useModuleAccess - Error fetching module access:', response.error);
          setModuleAccess([]);
          setHasAccess(false);
        } else {
          const modules = response.data || [];
          console.log('useModuleAccess - Module access retrieved:', modules);
          setModuleAccess(modules);
          
          // Check if user has access to the specific module if requested
          if (requiredModuleId) {
            const moduleHasAccess = modules.includes(requiredModuleId);
            console.log('useModuleAccess - Access to module', requiredModuleId, ':', moduleHasAccess);
            setHasAccess(moduleHasAccess);
          } else {
            setHasAccess(true);
          }
        }
      } catch (error) {
        console.error('useModuleAccess - Error in module access check:', error);
        setModuleAccess([]);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleAccess();
  }, [user, isAdmin, requiredModuleId]);

  return { moduleAccess, hasAccess, loading };
};

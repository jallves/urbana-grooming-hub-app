
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
          .single();

        if (roleError || !roleData) {
          console.log('useModuleAccess - User is not a barber:', roleError);
          setModuleAccess([]);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // First, get the staff record for this user
        console.log('useModuleAccess - Looking up staff record for email:', user.email);
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .single();

        if (staffError || !staffData) {
          console.error('useModuleAccess - Staff record not found:', staffError);
          setModuleAccess([]);
          setHasAccess(false);
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

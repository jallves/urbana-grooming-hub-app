
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useModuleAccess = (requiredModuleId?: string) => {
  const { user, isAdmin } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moduleAccess, setModuleAccess] = useState<string[]>([]);

  useEffect(() => {
    const checkModuleAccess = async () => {
      try {
        // Admins have access to everything
        if (isAdmin) {
          setHasAccess(true);
          setModuleAccess(['appointments', 'clients', 'services', 'reports']);
          setLoading(false);
          return;
        }

        if (!user) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Find staff record for current user
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (staffError || !staffData) {
          console.error('Error finding staff record:', staffError);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Get module access for this staff member using RPC
        const { data, error } = await supabase
          .rpc('get_staff_module_access', { staff_id_param: staffData.id });

        if (error) {
          console.error('Error fetching module access:', error);
          setHasAccess(false);
          setModuleAccess([]);
        } else if (data) {
          const moduleIds = Array.isArray(data) ? data : [];
          setModuleAccess(moduleIds);
          
          // If checking for a specific module
          if (requiredModuleId) {
            setHasAccess(moduleIds.includes(requiredModuleId));
          } else {
            setHasAccess(moduleIds.length > 0);
          }
        } else {
          setHasAccess(false);
          setModuleAccess([]);
        }
      } catch (error) {
        console.error('Error in checkModuleAccess:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkModuleAccess();
  }, [user, isAdmin, requiredModuleId]);

  return { 
    hasAccess, 
    loading, 
    moduleAccess
  };
};

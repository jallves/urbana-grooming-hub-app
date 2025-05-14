
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
      // Admin has access to everything
      if (isAdmin) {
        setModuleAccess(['admin', 'appointments', 'clients', 'services', 'reports']);
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // If no user, they don't have access
      if (!user) {
        setModuleAccess([]);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        // First, get the staff record for this user
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .single();

        if (staffError || !staffData) {
          console.error('Staff record not found:', staffError);
          setModuleAccess([]);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Get module access for this staff member using our type-safe wrapper
        const response = await supabaseRPC.getStaffModuleAccess(staffData.id);

        if (response.error) {
          console.error('Error fetching module access:', response.error);
          setModuleAccess([]);
          setHasAccess(false);
        } else if (response.data) {
          setModuleAccess(response.data || []);
          // Check if user has access to the specific module if requested
          if (requiredModuleId) {
            setHasAccess((response.data || []).includes(requiredModuleId));
          } else {
            setHasAccess(true);
          }
        }
      } catch (error) {
        console.error('Error in module access check:', error);
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

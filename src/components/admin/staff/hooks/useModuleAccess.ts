
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseRPC, GetStaffModuleAccessResponse } from '@/types/supabase-rpc';

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
        const { data, error } = await supabaseRPC.getStaffModuleAccess(staffData.id);

        if (error) {
          console.error('Error fetching module access:', error);
          setModuleAccess([]);
          setHasAccess(false);
        } else if (data) {
          setModuleAccess(data);
          // Check if user has access to the specific module if requested
          if (requiredModuleId) {
            setHasAccess(data.includes(requiredModuleId));
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

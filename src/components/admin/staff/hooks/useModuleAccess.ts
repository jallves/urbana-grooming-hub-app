
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useModuleAccess = (requiredModuleId?: string) => {
  const { user, isAdmin, isBarber } = useAuth();
  const [moduleAccess, setModuleAccess] = useState<string[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip initial render to prevent double fetch
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const fetchModuleAccess = async () => {
      // Admin has access to everything
      if (isAdmin) {
        console.log('useModuleAccess - User is admin, granting full access');
        const allModules = ['appointments', 'clients', 'services', 'reports', 'admin', 'finances', 'marketing', 'analytics', 'support', 'settings'];
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
        // Default modules for barbers based on RBAC structure
        const defaultModules = ['appointments', 'clients', 'reports'];
        
        // Barbers always have access to these modules
        if (isBarber) {
          // If checking for a default module, grant access immediately
          if (requiredModuleId && defaultModules.includes(requiredModuleId)) {
            console.log('useModuleAccess - Barber has default access to module:', requiredModuleId);
            setModuleAccess(defaultModules);
            setHasAccess(true);
            setLoading(false);
            return;
          }
          
          // For non-default modules, check database for additional permissions
          try {
            let staffId;
            
            // Get the barber record for this barber
            const { data: barberData, error: barberError } = await supabase
              .from('barbers')
              .select('id')
              .eq('email', user.email)
              .maybeSingle();
              
            if (barberData && !barberError) {
              staffId = barberData.id;
              
              // Get specific module access from staff_module_access table
              const { data: moduleData, error: moduleError } = await supabase
                .from('staff_module_access')
                .select('module_id')
                .eq('staff_id', staffId);
                
              if (!moduleError && moduleData && moduleData.length > 0) {
                const specificModules = moduleData.map(item => item.module_id);
                
                // Combine default modules with specific modules
                const combinedModules = [...new Set([...defaultModules, ...specificModules])];
                setModuleAccess(combinedModules);
                setHasAccess(requiredModuleId ? combinedModules.includes(requiredModuleId) : true);
                setLoading(false);
                return;
              }
            } else {
              // Try direct user ID lookup if barber record not found
              const { data: directModules, error: directError } = await supabase
                .from('staff_module_access')
                .select('module_id')
                .eq('staff_id', user.id);
                
              if (!directError && directModules && directModules.length > 0) {
                const modules = directModules.map(item => item.module_id);
                const combinedModules = [...new Set([...defaultModules, ...modules])];
                setModuleAccess(combinedModules);
                setHasAccess(requiredModuleId ? combinedModules.includes(requiredModuleId) : true);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error('useModuleAccess - Error checking specific permissions:', error);
          }
          
          // If no specific permissions found, use default barber modules per RBAC
          console.log('useModuleAccess - Using default barber modules:', defaultModules);
          setModuleAccess(defaultModules);
          setHasAccess(requiredModuleId ? defaultModules.includes(requiredModuleId) : true);
          setLoading(false);
          return;
        }
        
        // Not a barber, so no access
        setModuleAccess([]);
        setHasAccess(false);
        setLoading(false);
      } catch (error) {
        console.error('useModuleAccess - Error in module access check:', error);
        setModuleAccess([]);
        setHasAccess(false);
        setLoading(false);
      }
    };

    fetchModuleAccess();
  }, [user?.id, isAdmin, isBarber, requiredModuleId]);

  return { moduleAccess, hasAccess, loading };
};

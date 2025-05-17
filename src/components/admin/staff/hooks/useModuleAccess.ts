
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useModuleAccess = (requiredModuleId?: string) => {
  const { user, isAdmin, isBarber } = useAuth();
  const [moduleAccess, setModuleAccess] = useState<string[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchModuleAccess = async () => {
      console.log('useModuleAccess - Checking access for module:', requiredModuleId);
      console.log('useModuleAccess - User data:', user?.id, 'isAdmin:', isAdmin, 'isBarber:', isBarber);
      
      // Admin has access to everything
      if (isAdmin) {
        console.log('useModuleAccess - User is admin, granting full access');
        const allModules = ['appointments', 'clients', 'services', 'reports', 'admin'];
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
        // Verificação para barbeiros: todos têm acesso aos módulos básicos
        if (isBarber) {
          console.log('useModuleAccess - User is barber, checking specific permissions');
          
          // Default modules for barbers
          const defaultModules = ['appointments', 'reports'];
          
          // Automatically grant access to default modules for barbers
          if (requiredModuleId && defaultModules.includes(requiredModuleId)) {
            console.log('useModuleAccess - Barber has default access to module:', requiredModuleId);
            setModuleAccess(defaultModules);
            setHasAccess(true);
            setLoading(false);
            return;
          }
          
          // Check for additional module access in database
          let staffId;
          
          // Get the staff record for this barber
          const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
            
          if (staffData && !staffError) {
            staffId = staffData.id;
            console.log('useModuleAccess - Found staff record:', staffId);
            
            // Get specific module access from staff_module_access table
            const { data: moduleData, error: moduleError } = await supabase
              .from('staff_module_access')
              .select('module_id')
              .eq('staff_id', staffId);
              
            if (!moduleError && moduleData && moduleData.length > 0) {
              const specificModules = moduleData.map(item => item.module_id);
              console.log('useModuleAccess - Staff has specific module access:', specificModules);
              
              // Combine default modules with specific modules
              const combinedModules = [...new Set([...defaultModules, ...specificModules])];
              setModuleAccess(combinedModules);
              setHasAccess(requiredModuleId ? combinedModules.includes(requiredModuleId) : true);
              setLoading(false);
              return;
            }
          } else {
            // Try direct user ID lookup if staff record not found
            const { data: directModules, error: directError } = await supabase
              .from('staff_module_access')
              .select('module_id')
              .eq('staff_id', user.id);
              
            if (!directError && directModules && directModules.length > 0) {
              const modules = directModules.map(item => item.module_id);
              const combinedModules = [...new Set([...defaultModules, ...modules])];
              console.log('useModuleAccess - Direct modules retrieved:', combinedModules);
              setModuleAccess(combinedModules);
              setHasAccess(requiredModuleId ? combinedModules.includes(requiredModuleId) : true);
              setLoading(false);
              return;
            }
          }
          
          // If no specific permissions found, use default barber modules
          console.log('useModuleAccess - Using default barber modules:', defaultModules);
          setModuleAccess(defaultModules);
          setHasAccess(requiredModuleId ? defaultModules.includes(requiredModuleId) : true);
          setLoading(false);
          return;
        } else {
          // Not a barber, so no specific module access
          console.log('useModuleAccess - User is not a barber, denying module access');
          setModuleAccess([]);
          setHasAccess(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('useModuleAccess - Error in module access check:', error);
        setModuleAccess([]);
        setHasAccess(false);
        setLoading(false);
      }
    };

    fetchModuleAccess();
  }, [user, isAdmin, isBarber, requiredModuleId]);

  return { moduleAccess, hasAccess, loading };
};

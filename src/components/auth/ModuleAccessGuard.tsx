
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoaderPage } from '@/components/ui/loader-page';

interface ModuleAccessGuardProps {
  moduleId: string;
  children: React.ReactNode;
}

const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({ moduleId, children }) => {
  const { user, isAdmin } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkModuleAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Admins have access to all modules
      if (isAdmin) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      try {
        // Check if user has access to this specific module
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .eq('is_active', true)
          .maybeSingle();

        if (!staffData) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Check module access
        const { data: moduleAccess } = await supabase
          .from('staff_module_access')
          .select('module_id')
          .eq('staff_id', staffData.id)
          .eq('module_id', moduleId)
          .maybeSingle();

        setHasAccess(!!moduleAccess);
      } catch (error) {
        console.error('Error checking module access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkModuleAccess();
  }, [user, isAdmin, moduleId]);

  if (loading) {
    return <LoaderPage />;
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Restrito</h3>
          <p className="text-gray-600">Você não tem permissão para acessar este módulo.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleAccessGuard;

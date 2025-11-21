import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface PermissionsContextType {
  moduleAccess: Record<string, boolean>;
  loading: boolean;
  checkModuleAccess: (moduleName: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refreshPermissions = useCallback(async () => {
    if (!user) {
      setModuleAccess({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Verificar todos os módulos de uma vez
      const modulesToCheck = ['financeiro', 'configuracoes', 'erp'];
      const results: Record<string, boolean> = {};

      // Fazer todas as verificações em paralelo
      const checks = await Promise.all(
        modulesToCheck.map(async (module) => {
          try {
            const { data, error } = await supabase.rpc('has_module_access', {
              _user_id: user.id,
              _module_name: module,
            });
            return { module, access: error ? true : (data ?? true) };
          } catch {
            return { module, access: true }; // Default allow on error
          }
        })
      );

      // Construir o objeto de resultados
      checks.forEach(({ module, access }) => {
        results[module] = access;
      });

      setModuleAccess(results);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      // Em caso de erro, permitir acesso a tudo
      setModuleAccess({
        financeiro: true,
        configuracoes: true,
        erp: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const checkModuleAccess = useCallback(
    (moduleName: string): boolean => {
      return moduleAccess[moduleName] !== false;
    },
    [moduleAccess]
  );

  return (
    <PermissionsContext.Provider
      value={{
        moduleAccess,
        loading,
        checkModuleAccess,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

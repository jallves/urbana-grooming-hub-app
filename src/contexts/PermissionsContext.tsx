import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface PermissionsContextType {
  moduleAccess: Record<string, boolean>;
  loading: boolean;
  checkModuleAccess: (moduleName: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canAccessModule, loading: authLoading } = useAuth();

  // Simplificado: apenas usa a função do AuthContext
  const checkModuleAccess = (moduleName: string): boolean => {
    return canAccessModule(moduleName);
  };

  const refreshPermissions = async () => {
    // Não é mais necessário, pois a validação é feita no AuthContext
    console.log('[PermissionsContext] Refresh não necessário - validação única no AuthContext');
  };

  // Construir moduleAccess baseado nas regras conhecidas
  const moduleAccess: Record<string, boolean> = {
    financeiro: canAccessModule('financeiro'),
    configuracoes: canAccessModule('configuracoes'),
    erp: canAccessModule('erp'),
  };

  return (
    <PermissionsContext.Provider
      value={{
        moduleAccess,
        loading: authLoading,
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

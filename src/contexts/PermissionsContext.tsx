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
  const { canAccessModule, loading: authLoading, rolesChecked, userRole } = useAuth();

  // Simplificado: apenas usa a função do AuthContext
  const checkModuleAccess = (moduleName: string): boolean => {
    if (!rolesChecked) {
      console.log('[PermissionsContext] ⏳ Roles não verificados ainda');
      return false;
    }
    return canAccessModule(moduleName);
  };

  const refreshPermissions = async () => {
    // Não é mais necessário, pois a validação é feita no AuthContext
    console.log('[PermissionsContext] Refresh não necessário - validação única no AuthContext');
  };

  // Construir moduleAccess apenas quando roles estiverem verificados
  // IMPORTANTE: Não chamar canAccessModule durante renderização inicial
  const moduleAccess: Record<string, boolean> = React.useMemo(() => {
    if (!rolesChecked) {
      console.log('[PermissionsContext] 🔄 Aguardando verificação de roles...');
      return {
        financeiro: false,
        configuracoes: false,
        erp: false,
      };
    }
    
    // Se não há role definido após verificação, é um usuário cliente (não admin/staff)
    // Retornar false para tudo sem chamar canAccessModule
    if (!userRole) {
      console.log('[PermissionsContext] ℹ️ Usuário sem role admin/staff (cliente) - sem permissões de módulos');
      return {
        financeiro: false,
        configuracoes: false,
        erp: false,
      };
    }
    
    console.log('[PermissionsContext] ✅ Calculando permissões para role:', userRole);
    return {
      financeiro: canAccessModule('financeiro'),
      configuracoes: canAccessModule('configuracoes'),
      erp: canAccessModule('erp'),
    };
  }, [rolesChecked, userRole, canAccessModule]);

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

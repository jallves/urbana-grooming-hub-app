
import React from 'react';
import { useModuleAccess } from '../admin/staff/hooks/useModuleAccess';
import { Shield } from 'lucide-react';

interface ModuleAccessGuardProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({
  moduleId,
  children,
  fallback
}) => {
  const { hasAccess, loading } = useModuleAccess(moduleId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 w-full">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Shield className="h-12 w-12 text-zinc-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">Acesso Restrito</h3>
        <p className="text-zinc-400 max-w-md">
          Você não tem permissão para acessar este módulo. Entre em contato com o administrador para solicitar acesso.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleAccessGuard;

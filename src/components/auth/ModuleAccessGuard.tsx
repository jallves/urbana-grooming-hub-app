
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useModuleAccess } from '@/components/admin/staff/hooks/useModuleAccess';
import { Shield } from 'lucide-react';

interface ModuleAccessGuardProps {
  moduleId: string;
  children: React.ReactNode;
  fallbackPath?: string;
}

const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({ 
  moduleId, 
  children, 
  fallbackPath = '/barbeiro/dashboard' 
}) => {
  const { hasAccess, loading } = useModuleAccess(moduleId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-urbana-gold rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-urbana-black text-white">
        <Shield className="h-16 w-16 text-urbana-gold mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-center max-w-md mb-6">
          Você não tem permissão para acessar este módulo. 
          Entre em contato com um administrador para solicitar acesso.
        </p>
        <button 
          onClick={() => window.location.href = fallbackPath}
          className="bg-urbana-gold text-black px-6 py-2 rounded-md hover:bg-urbana-gold/80 transition-colors"
        >
          Voltar para Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleAccessGuard;

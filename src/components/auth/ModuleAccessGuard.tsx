
import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const { isAdmin, isBarber, user } = useAuth();
  
  // Define base modules always available to barbers
  const baseBarberModules = ['appointments', 'clients', 'commissions'];
  
  // Check if module is accessible to barbers by default
  const isBarberDefaultModule = baseBarberModules.includes(moduleId);
  
  // Admin has access to everything
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // REMOVED HARDCODED EMAIL CHECKS - Now only using database roles
  
  // Barber has access to default modules
  if (isBarber && isBarberDefaultModule) {
    return <>{children}</>;
  }

  // No access - show fallback
  return fallback || (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Shield className="h-12 w-12 text-zinc-400 mb-4" />
      <h3 className="text-xl font-medium mb-2">Acesso Restrito</h3>
      <p className="text-zinc-400 max-w-md">
        Você não tem permissão para acessar este módulo. Entre em contato com o administrador para solicitar acesso.
      </p>
    </div>
  );
};

export default ModuleAccessGuard;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModuleAccess } from '../admin/staff/hooks/useModuleAccess';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { isAdmin, user } = useAuth();
  const { hasAccess, loading, moduleAccess } = useModuleAccess(moduleId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeniedMessage, setShowDeniedMessage] = useState(false);
  
  // Debug logs
  useEffect(() => {
    console.log('ModuleAccessGuard - Checking access for module:', moduleId);
    console.log('ModuleAccessGuard - User is admin:', isAdmin);
    console.log('ModuleAccessGuard - Module access:', moduleAccess);
    console.log('ModuleAccessGuard - Has access:', hasAccess);
  }, [moduleId, isAdmin, hasAccess, moduleAccess]);

  // Show toast notification on access denial
  useEffect(() => {
    if (!loading && !hasAccess && user && !isAdmin) {
      setShowDeniedMessage(true);
      toast({
        title: "Acesso Restrito",
        description: "Você não tem permissão para acessar este módulo",
        variant: "destructive"
      });
    }
  }, [loading, hasAccess, user, toast, isAdmin]);

  // Admin has access to everything
  if (isAdmin) {
    console.log('ModuleAccessGuard - Admin access granted');
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 w-full">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!hasAccess) {
    console.log('ModuleAccessGuard - Access denied to module:', moduleId);
    
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

  console.log('ModuleAccessGuard - Access granted to module:', moduleId);
  return <>{children}</>;
};

export default ModuleAccessGuard;

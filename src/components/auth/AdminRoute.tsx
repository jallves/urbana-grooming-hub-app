
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean;
  requiredModule?: string;
  allowedRoles?: string[];
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  allowBarber = false,
  requiredModule,
}) => {
  const { user, isAdmin, isBarber, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [moduleAccess, setModuleAccess] = useState<boolean | null>(null);
  const [checkingModule, setCheckingModule] = useState(false);

  // Verificar acesso ao módulo se necessário
  useEffect(() => {
    const checkModuleAccess = async () => {
      if (!user || !requiredModule || loading) return;
      
      setCheckingModule(true);
      try {
        const { data, error } = await supabase.rpc('has_module_access', {
          _user_id: user.id,
          _module_name: requiredModule,
        });

        if (error) throw error;
        setModuleAccess(data);
      } catch (error) {
        console.error('Erro ao verificar acesso ao módulo:', error);
        setModuleAccess(false);
      } finally {
        setCheckingModule(false);
      }
    };

    checkModuleAccess();
  }, [user, requiredModule, loading]);

  const hasAccess = user ? (isAdmin || (allowBarber && isBarber)) : false;

  // Always call useEffect, but only show toast when conditions are met
  useEffect(() => {
    if (user && !loading && !hasAccess) {
      toast({
        title: 'Acesso Restrito',
        description: 'Você não tem permissão para acessar esta área',
        variant: 'destructive',
      });
    }
  }, [user, loading, hasAccess, toast]);

  if (loading || checkingModule) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-gray-50">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-gray-700 mb-4" />
        <p className="text-gray-600 text-base sm:text-lg font-medium">
          Verificando permissões...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasAccess || (requiredModule && moduleAccess === false)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Sem permissão</h2>
          <p className="text-muted-foreground">
            {requiredModule && moduleAccess === false
              ? 'Você não tem permissão para acessar este módulo.'
              : 'Você não tem permissão para acessar esta área.'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;

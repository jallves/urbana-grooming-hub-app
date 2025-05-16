
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean; // New prop to specify if barbers are allowed
  requiredModule?: string; // New prop to specify required module
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  allowBarber = true, // Alterado para true por padrão
  requiredModule
}) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check for barber role
  const [isBarber, setIsBarber] = React.useState<boolean | null>(null);
  const [hasModuleAccess, setHasModuleAccess] = React.useState<boolean>(false);
  const [checkingAccess, setCheckingAccess] = React.useState<boolean>(true);
  
  useEffect(() => {
    if (!loading && user) {
      const checkBarberRole = async () => {
        try {
          // If already verified as admin, skip further checks
          if (isAdmin) {
            setIsBarber(false); // Admin is not considered barber
            setHasModuleAccess(true); // Admin has access to everything
            setCheckingAccess(false);
            return;
          }
          
          const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id)
            .eq('role', 'barber')
            .maybeSingle();
          
          if (error) {
            console.error('Error checking barber role:', error);
            setIsBarber(false);
          } else {
            setIsBarber(!!data);
            
            // Se o usuário é barbeiro, sempre dê acesso (independente do módulo)
            if (data) {
              setHasModuleAccess(true);
              setCheckingAccess(false);
            } else if (requiredModule) {
              // Se não é barbeiro e há requisito de módulo, verificar
              checkModuleAccess(user.id, requiredModule);
            } else {
              setCheckingAccess(false);
            }
          }
        } catch (error) {
          console.error('Error in barber role check:', error);
          setIsBarber(false);
          setCheckingAccess(false);
        }
      };
      
      checkBarberRole();
    } else if (!loading) {
      setIsBarber(false);
      setCheckingAccess(false);
    }
  }, [user, loading, isAdmin, requiredModule]);
  
  // Check for module access (mantido para compatibilidade)
  const checkModuleAccess = async (userId: string, moduleId: string) => {
    try {
      // Get staff ID first
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user?.email)
        .maybeSingle();
        
      if (staffError || !staffData) {
        console.error('Staff record not found:', staffError || 'No record');
        setHasModuleAccess(false);
        setCheckingAccess(false);
        return;
      }
      
      // Then check module access
      const { data, error } = await supabase
        .from('staff_module_access')
        .select('*')
        .eq('staff_id', staffData.id)
        .eq('module_id', moduleId)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking module access:', error);
        setHasModuleAccess(false);
      } else {
        setHasModuleAccess(!!data);
      }
    } catch (error) {
      console.error('Error checking module access:', error);
      setHasModuleAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };
  
  // Debug logging
  useEffect(() => {
    console.log('AdminRoute: Access state', { 
      isLoading: loading || checkingAccess, 
      isAuthenticated: !!user, 
      isAdmin,
      isBarber,
      allowBarber,
      requiredModule,
      hasModuleAccess,
      path: location.pathname
    });
  }, [loading, checkingAccess, user, isAdmin, isBarber, allowBarber, requiredModule, hasModuleAccess, location.pathname]);
  
  // If still loading, show spinner
  if (loading || checkingAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    console.log('AdminRoute: Redirecting to /auth (not authenticated)');
    toast({
      title: 'Acesso Restrito',
      description: 'Você precisa estar logado para acessar esta página',
      variant: 'destructive',
    });
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  // Special case for specific email
  if (user.email === 'joao.colimoides@gmail.com') {
    console.log('AdminRoute: Allowing access for special user');
    return <>{children}</>;
  }
  
  // Access control based on roles
  if (isAdmin) {
    console.log('AdminRoute: Allowing access for admin');
    return <>{children}</>;
  }
  
  // Barber with allowed access to specific page
  if (isBarber && allowBarber) {
    // Todos os barbeiros têm permissão para acessar o painel admin
    console.log('AdminRoute: Allowing access for barber');
    return <>{children}</>;
  }
  
  // Default: No access, redirect to appropriate location
  console.log(`AdminRoute: Access denied, redirecting ${isBarber ? 'barber' : 'user'} to appropriate page`);
  toast({
    title: 'Acesso Restrito',
    description: 'Você não tem permissão para acessar o painel administrativo',
    variant: 'destructive',
  });
  
  // Redirect barbers to barber dashboard, regular users to home
  return <Navigate to={isBarber ? "/barbeiro/dashboard" : "/"} replace />;
};

export default AdminRoute;

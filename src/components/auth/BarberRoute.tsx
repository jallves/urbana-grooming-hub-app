
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';

interface BarberRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean;
  requiredModule?: string;
}

const BarberRoute: React.FC<BarberRouteProps> = ({ 
  children, 
  allowBarber = true, 
  requiredModule 
}) => {
  const { user, loading, isAdmin, isBarber } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (loading) {
    return <AuthLoadingScreen message="Verificando acesso..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // Check access permissions
  const hasAccess = isAdmin || (allowBarber && isBarber);

  if (!hasAccess) {
    console.log('BarberRoute - Access DENIED for:', user.email);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Usuário não tem permissão para acessar o Painel do Barbeiro, entrar em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BarberRoute;

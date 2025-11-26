
import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';

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
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/barbeiro/login', { replace: true });
  };

  // Show loading screen while checking authentication - sem mensagens para evitar flash
  if (loading) {
    return <AuthLoadingScreen message="Carregando..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // Check access permissions
  const hasAccess = isAdmin || (allowBarber && isBarber);

  if (!hasAccess) {
    console.log('[BarberRoute] Acesso NEGADO');
    console.log('[BarberRoute] Usuário:', user.email);
    console.log('[BarberRoute] isAdmin:', isAdmin);
    console.log('[BarberRoute] isBarber:', isBarber);
    console.log('[BarberRoute] allowBarber:', allowBarber);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-6 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem acesso ao painel do barbeiro.
          </p>
          <p className="text-sm text-muted-foreground/80">
            Este painel é exclusivo para profissionais cadastrados. Entre em contato com o administrador.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="default"
              className="w-full sm:w-auto"
            >
              Voltar ao site
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo com transição suave para evitar flash
  return <div className="animate-fade-in">{children}</div>;
};
export default BarberRoute;

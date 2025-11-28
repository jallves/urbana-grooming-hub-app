
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { user, loading, rolesChecked, isAdmin, isBarber, isMaster, isManager, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // CRÍTICO: Persistência de rota - salvar SEMPRE a rota atual quando autenticado
  useEffect(() => {
    if (!loading && rolesChecked && user) {
      const hasAccess = isMaster || isAdmin || isManager || (allowBarber && isBarber);
      if (hasAccess && location.pathname.startsWith('/barbeiro/')) {
        // Salva a rota atual para persistir após reload
        console.log('[BarberRoute] 💾 Salvando rota:', location.pathname);
        localStorage.setItem('barber_last_route', location.pathname);
      }
    }
  }, [location.pathname, loading, rolesChecked, user, isMaster, isAdmin, isManager, isBarber, allowBarber]);

  // Detectar loading infinito (mais de 3 segundos)
  useEffect(() => {
    if (loading || !rolesChecked) {
      const timer = setTimeout(() => {
        console.warn('[BarberRoute] ⚠️ Loading timeout detectado - mostrando dialog de recuperação');
        setLoadingTimeout(true);
        setShowRecoveryDialog(true);
      }, 3000); // 3 segundos

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading, rolesChecked]);

  const handleLogout = () => {
    console.log('[BarberRoute] 🚪 Logout forçado');
    localStorage.clear();
    signOut();
    navigate('/barbeiro/login', { replace: true });
  };

  const handleGoToDashboard = () => {
    console.log('[BarberRoute] 🏠 Redirecionando para dashboard do barbeiro');
    setShowRecoveryDialog(false);
    // Usar window.location para forçar reload completo
    window.location.href = '/barbeiro/dashboard';
  };

  // Show loading screen while checking authentication
  // CRÍTICO: Durante loading, NUNCA redirecionar
  if (loading || !rolesChecked) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-background">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-base sm:text-lg font-medium animate-pulse">
            Carregando...
          </p>
          {loadingTimeout && (
            <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-4 animate-pulse">
              Isso está demorando mais do que o normal...
            </p>
          )}
        </div>

        {/* Dialog de Recuperação para Loading Infinito */}
        <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <AlertDialogTitle className="text-xl">Carregamento Lento</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base space-y-3">
                <p>
                  O carregamento está demorando mais do que o esperado. Isso pode ser um problema de sessão ou conexão.
                </p>
                <p className="font-semibold text-foreground">
                  O que você gostaria de fazer?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogAction
                onClick={handleGoToDashboard}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                <Home className="mr-2 h-4 w-4" />
                Ir para Dashboard
              </AlertDialogAction>
              <AlertDialogAction
                onClick={handleLogout}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Deslogar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // Check access permissions (admin, master, manager ou barber se permitido)
  const hasAccess = isMaster || isAdmin || isManager || (allowBarber && isBarber);

  if (!hasAccess) {
    console.log('[BarberRoute] ❌ Acesso NEGADO');
    console.log('[BarberRoute] Usuário:', user.email);
    console.log('[BarberRoute] isMaster:', isMaster);
    console.log('[BarberRoute] isAdmin:', isAdmin);
    console.log('[BarberRoute] isManager:', isManager);
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

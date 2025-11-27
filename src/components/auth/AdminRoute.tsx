import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { user, isAdmin, isBarber, isManager, isMaster, canAccessModule, loading, requiresPasswordChange, signOut, rolesChecked } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Persistência de rota: salvar rota atual quando mudar (somente se autenticado)
  useEffect(() => {
    if (!loading && rolesChecked && user) {
      localStorage.setItem('admin_last_route', location.pathname);
    }
  }, [location.pathname, loading, rolesChecked, user]);

  // Usuário tem acesso se for admin, manager, master ou (barber quando permitido)
  const hasAccess = user ? (isAdmin || isManager || isMaster || (allowBarber && isBarber)) : false;
  
  // Validação simplificada de módulo usando a função do AuthContext
  const hasModuleAccess = requiredModule ? canAccessModule(requiredModule) : true;

  // Detectar loading infinito (mais de 8 segundos)
  useEffect(() => {
    if (loading || !rolesChecked) {
      const timer = setTimeout(() => {
        console.warn('[AdminRoute] ⚠️ Loading timeout detectado - mostrando dialog de recuperação');
        setLoadingTimeout(true);
        setShowRecoveryDialog(true);
      }, 8000); // 8 segundos

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading, rolesChecked]);

  const handleLogout = async () => {
    console.log('[AdminRoute] 🚪 Logout forçado');
    localStorage.clear();
    await signOut();
  };

  const handleGoToDashboard = () => {
    console.log('[AdminRoute] 🏠 Redirecionando para dashboard');
    setShowRecoveryDialog(false);
    // Usar window.location para forçar reload completo
    window.location.href = '/admin';
  };

  // Durante loading OU enquanto roles não foram verificados, mostrar spinner
  // Isso garante que nunca mostramos conteúdo antes da validação completa
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

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirecionar para troca de senha se necessário (exceto se já estiver na página de troca)
  if (requiresPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!hasAccess || (requiredModule && !hasModuleAccess)) {
    console.error('[AdminRoute] 🚫 Acesso negado:', {
      hasAccess,
      hasModuleAccess,
      requiredModule,
      isAdmin,
      isMaster,
      userEmail: user?.email
    });
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-6 max-w-lg bg-card p-8 rounded-lg shadow-lg border border-border">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground font-playfair">🔒 Acesso Restrito</h2>
            <p className="text-muted-foreground font-raleway">
              {requiredModule && !hasModuleAccess
                ? 'Você não tem permissão para acessar este módulo.'
                : 'Você não tem permissão para acessar esta área.'}
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md text-left space-y-2">
            <p className="text-sm text-muted-foreground font-raleway">
              <strong className="text-foreground">Usuário:</strong> {user?.email}
            </p>
            <p className="text-xs text-muted-foreground font-raleway mt-4 italic">
              💡 Se suas permissões foram atualizadas recentemente, faça logout e login novamente para que as mudanças tenham efeito.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button 
              onClick={async () => {
                await signOut();
              }}
              className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 font-raleway font-medium"
            >
              Fazer Logout
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin'}
              variant="outline"
              className="border-border font-raleway"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo com transição suave
  return <div className="animate-fade-in">{children}</div>;
};

export default AdminRoute;

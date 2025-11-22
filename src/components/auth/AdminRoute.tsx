import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const { user, isAdmin, isBarber, isMaster, canAccessModule, loading, requiresPasswordChange, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const hasAccess = user ? (isAdmin || (allowBarber && isBarber)) : false;
  
  // Validação simplificada de módulo usando a função do AuthContext
  const hasModuleAccess = requiredModule ? canAccessModule(requiredModule) : true;

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

  if (loading) {
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
                window.location.href = '/auth';
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

  return <>{children}</>;
};

export default AdminRoute;

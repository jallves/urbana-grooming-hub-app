
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('AdminRoute: Usuário não autenticado, redirecionando para /auth');
      } else if (!isAdmin && user.email !== 'joao.colimoides@gmail.com') {
        console.log('AdminRoute: Usuário não é admin:', user.email);
        toast({
          title: "Acesso Restrito",
          description: "Você não tem permissão para acessar o painel administrativo.",
          variant: "destructive",
        });
      } else {
        console.log('AdminRoute: Acesso permitido para o usuário admin:', user.email);
      }
    }
  }, [loading, user, isAdmin, toast]);
  
  // Exibir mensagem detalhada de debug no console
  console.log('AdminRoute: Estado atual', { 
    isLoading: loading, 
    isAuthenticated: !!user, 
    userEmail: user?.email, 
    isAdmin: isAdmin,
    path: location.pathname,
    redirectTo: '/auth',
    currentState: location.state
  });
  
  // Se ainda estiver carregando, mostrar um spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }
  
  // Se não estiver autenticado, redirecionar para a página de login com o state preservado
  if (!user) {
    console.log('AdminRoute: Redirecionando para /auth pois usuário não está autenticado');
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  // Verificação especial para o email específico
  if (user.email === 'joao.colimoides@gmail.com') {
    console.log('AdminRoute: Permitindo acesso para usuário especial:', user.email);
    return <>{children}</>;
  }
  
  // Se não for admin, redirecionar para a página principal
  if (!isAdmin) {
    console.log("AdminRoute: Redirecionando para / pois usuário não é admin:", user.email);
    return <Navigate to="/" replace />;
  }
  
  // Se for admin, permitir acesso
  console.log('AdminRoute: Renderizando conteúdo admin para', user.email);
  return <>{children}</>;
};

export default AdminRoute;

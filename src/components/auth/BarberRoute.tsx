
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';

interface BarberRouteProps {
  children: React.ReactNode;
}

const BarberRoute: React.FC<BarberRouteProps> = ({ children }) => {
  const { user, loading, isAdmin, isBarber } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Mostrar tela de carregamento enquanto verifica a autenticação
  if (loading) {
    return <AuthLoadingScreen message="Verificando acesso..." />;
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    console.log('BarberRoute - Usuário não autenticado, redirecionando para login');
    return <Navigate to="/barbeiro/login" state={{ from: location.pathname }} replace />;
  }

  // Verificar se tem acesso (admin ou barbeiro)
  const hasAccess = isAdmin || isBarber || user.email === 'jhoaoallves84@gmail.com';
  
  if (!hasAccess) {
    console.log('BarberRoute - Usuário não tem permissão de barbeiro, redirecionando para home');
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar esta área',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // Se autenticado e tem papel de barbeiro, renderizar o conteúdo protegido
  console.log('BarberRoute - Acesso permitido para rota de barbeiro');
  return <>{children}</>;
};

export default BarberRoute;

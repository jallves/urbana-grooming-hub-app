import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRedirectGuardProps {
  children: React.ReactNode;
}

/**
 * Guarda que redireciona admins/masters/managers para o painel admin
 * se tentarem acessar outras áreas do sistema
 */
const AdminRedirectGuard: React.FC<AdminRedirectGuardProps> = ({ children }) => {
  const { user, isAdmin, isMaster, isManager, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Não fazer nada enquanto está carregando
    if (loading) return;

    // Se usuário é admin/master/manager e NÃO está em rota admin
    const isAdminUser = isMaster || isAdmin || isManager;
    const isInAdminRoute = location.pathname.startsWith('/admin');
    const isInAuthRoute = location.pathname.startsWith('/auth') || location.pathname === '/change-password';

    if (user && isAdminUser && !isInAdminRoute && !isInAuthRoute) {
      console.log('[AdminRedirectGuard] 🔄 Redirecionando admin para painel admin');
      navigate('/admin', { replace: true });
    }
  }, [user, isMaster, isAdmin, isManager, loading, location.pathname, navigate]);

  // Enquanto está carregando, não renderiza nada
  if (loading) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRedirectGuard;

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRedirectGuardProps {
  children: React.ReactNode;
}

/**
 * Guarda que redireciona usuários para seus painéis corretos baseado em suas roles:
 * - Clientes → /painel-cliente
 * - Admins/Masters/Managers → /admin
 * - Barbeiros → /barbeiro
 */
const AdminRedirectGuard: React.FC<AdminRedirectGuardProps> = ({ children }) => {
  const { user, isAdmin, isMaster, isManager, isBarber, isClient, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Não fazer nada enquanto está carregando
    if (loading) return;

    // Se não há usuário, deixa passar (outras guards cuidarão da autenticação)
    if (!user) return;

    const currentPath = location.pathname;
    
    // Clientes devem ser redirecionados para o painel de clientes
    if (isClient && !currentPath.startsWith('/painel-cliente') && !currentPath.startsWith('/auth')) {
      console.log('[AdminRedirectGuard] 🔄 Redirecionando cliente para painel de clientes');
      navigate('/painel-cliente', { replace: true });
      return;
    }

    // Admins/Masters/Managers devem ser redirecionados para o painel admin
    const isAdminUser = isMaster || isAdmin || isManager;
    if (isAdminUser && !currentPath.startsWith('/admin') && !currentPath.startsWith('/auth') && !currentPath.startsWith('/change-password')) {
      console.log('[AdminRedirectGuard] 🔄 Redirecionando admin para painel admin');
      navigate('/admin', { replace: true });
      return;
    }

    // Barbeiros devem ser redirecionados para o painel de barbeiro
    if (isBarber && !currentPath.startsWith('/barbeiro') && !currentPath.startsWith('/auth')) {
      console.log('[AdminRedirectGuard] 🔄 Redirecionando barbeiro para painel de barbeiro');
      navigate('/barbeiro/dashboard', { replace: true });
      return;
    }
  }, [user, isMaster, isAdmin, isManager, isBarber, isClient, loading, location.pathname, navigate]);

  // Enquanto está carregando, renderiza os children
  return <>{children}</>;
};

export default AdminRedirectGuard;

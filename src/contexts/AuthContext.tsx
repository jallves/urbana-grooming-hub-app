import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isMaster: boolean;
  isManager: boolean;
  isClient: boolean;
  userRole: 'master' | 'admin' | 'manager' | 'barber' | 'client' | null;
  rolesChecked: boolean;
  requiresPasswordChange: boolean;
  canAccessModule: (moduleName: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBarber, setIsBarber] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<'master' | 'admin' | 'manager' | 'barber' | 'client' | null>(null);
  const [rolesChecked, setRolesChecked] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const applyRole = (role: 'master' | 'admin' | 'manager' | 'barber' | 'client' | null) => {
    setUserRole(role);
    setIsMaster(role === 'master');
    setIsAdmin(role === 'admin' || role === 'master');
    setIsManager(role === 'manager');
    setIsBarber(role === 'barber');
    setIsClient(role === 'client');
    setRolesChecked(true);
  };

  const checkUserRoles = async (userId: string): Promise<'master' | 'admin' | 'manager' | 'barber' | 'client' | null> => {
    console.log('[AuthContext] 🔍 Verificando tipo de usuário para:', userId);
    
    try {
      // Buscar role diretamente na tabela user_roles (agora inclui 'client')
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('[AuthContext] ❌ Erro ao buscar role:', roleError.message);
        return null;
      }

      if (roleData) {
        console.log('[AuthContext] ✅ Role encontrada:', roleData.role);
        return roleData.role as 'master' | 'admin' | 'manager' | 'barber' | 'client';
      }

      console.warn('[AuthContext] ⚠️ Usuário sem role na user_roles');
      return null;
    } catch (error: any) {
      console.error('[AuthContext] ❌ Erro ao verificar roles:', error.message);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Timeout de segurança - após 10s, desiste e marca como não carregando
        loadingTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('[AuthContext] ⏱️ Timeout na verificação de auth - finalizando loading');
            setLoading(false);
            setRolesChecked(true);
          }
        }, 10000);

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const role = await checkUserRoles(session.user.id);
          if (mounted) {
            applyRole(role);
            setLoading(false);
            clearTimeout(loadingTimeout);
          }
        } else {
          setLoading(false);
          setRolesChecked(true);
          clearTimeout(loadingTimeout);
        }
      } catch (error) {
        console.error('[AuthContext] Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
          setRolesChecked(true);
          clearTimeout(loadingTimeout);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          applyRole(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            const role = await checkUserRoles(session.user.id);
            if (mounted) {
              applyRole(role);
              setLoading(false);
            }
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsAdmin(false);
    setIsBarber(false);
    setIsMaster(false);
    setIsManager(false);
    setIsClient(false);
    setUserRole(null);
    setUser(null);
    setRolesChecked(true);
    
    await supabase.auth.signOut();
  };

  const canAccessModule = (moduleName: string): boolean => {
    if (!rolesChecked || !userRole) return false;
    if (userRole === 'master') return true;
    if (userRole === 'admin') return moduleName !== 'configuracoes';
    if (userRole === 'manager') return moduleName !== 'financeiro' && moduleName !== 'configuracoes';
    return false;
  };

  const value = {
    user,
    loading,
    isAdmin,
    isBarber,
    isMaster,
    isManager,
    isClient,
    userRole,
    rolesChecked,
    requiresPasswordChange,
    canAccessModule,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider as default };

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useForceLogoutListener } from '@/hooks/useForceLogoutListener';

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
  signOut: () => void;
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
  const [session, setSession] = useState<any>(null); // CRÍTICO: Armazenar session completa
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBarber, setIsBarber] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<'master' | 'admin' | 'manager' | 'barber' | 'client' | null>(null);
  const [rolesChecked, setRolesChecked] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  // Listener para logout forçado (para admins, barbeiros, etc)
  useForceLogoutListener(user?.id);

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
      // Buscar role diretamente na tabela user_roles sem timeout agressivo
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

    // CRÍTICO: Setup do listener PRIMEIRO para capturar todos os eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[AuthContext] 🔔 Auth event:', event);
        
        // SEMPRE atualiza a session primeiro
        setSession(session);
        
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] 👋 Usuário deslogado');
          setUser(null);
          applyRole(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            console.log('[AuthContext] ✅ Sessão ativa:', event);
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

    // DEPOIS do listener, inicializar com sessão existente
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] 🔍 Verificando sessão existente...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setSession(session); // CRÍTICO: Armazenar session

        if (session?.user) {
          console.log('[AuthContext] ✅ Sessão encontrada para:', session.user.email);
          setUser(session.user);
          const role = await checkUserRoles(session.user.id);
          if (mounted) {
            applyRole(role);
            setLoading(false);
          }
        } else {
          console.log('[AuthContext] ℹ️ Nenhuma sessão encontrada');
          setLoading(false);
          setRolesChecked(true);
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
          setRolesChecked(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = () => {
    console.log('[AuthContext] 🚪 Logout instantâneo - limpeza TOTAL');
    
    // 1. LIMPAR ESTADO LOCAL IMEDIATAMENTE (síncrono)
    setIsAdmin(false);
    setIsBarber(false);
    setIsMaster(false);
    setIsManager(false);
    setIsClient(false);
    setUserRole(null);
    setUser(null);
    setSession(null); // CRÍTICO: Limpar session também
    setRolesChecked(true);
    setLoading(false);
    
    // 2. LIMPAR TODO O LOCALSTORAGE IMEDIATAMENTE (síncrono)
    localStorage.removeItem('admin_last_route');
    localStorage.removeItem('barber_last_route'); // CRÍTICO: Limpa rota salva
    localStorage.removeItem('client_last_route');
    localStorage.removeItem('totem_last_route');
    localStorage.removeItem('user_role_cache');
    localStorage.removeItem('barber_session_token');
    localStorage.removeItem('client_session_token');
    
    // 3. Limpar TODAS as chaves do Supabase para garantir logout completo
    try {
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      supabaseKeys.forEach(key => {
        console.log('[AuthContext] 🧹 Limpando chave:', key);
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('[AuthContext] ⚠️ Erro ao limpar chaves do Supabase:', error);
    }
    
    // 4. Fazer logout do Supabase em background (sem await - não bloqueia)
    supabase.auth.signOut().catch(err => {
      console.warn('[AuthContext] ⚠️ Erro ao fazer signOut do Supabase (background):', err);
    });
    
    console.log('[AuthContext] ✅ Limpeza total concluída');
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

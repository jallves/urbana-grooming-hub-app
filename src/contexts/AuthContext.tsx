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

  const inferRoleFromMetadata = (u: User): 'master' | 'admin' | 'manager' | 'barber' | 'client' | null => {
    const userType = (u.user_metadata as any)?.user_type;

    // Atualmente o cadastro de clientes grava user_type="client" no user_metadata
    if (userType === 'client') return 'client';

    // (Opcional) se no futuro vocês gravarem algo como user_type="barber" etc.
    if (userType === 'barber') return 'barber';
    if (userType === 'manager') return 'manager';
    if (userType === 'admin') return 'admin';
    if (userType === 'master') return 'master';

    return null;
  };

  const checkUserRoles = async (
    u: User
  ): Promise<'master' | 'admin' | 'manager' | 'barber' | 'client' | null> => {
    console.log('[AuthContext] 🔍 Verificando tipo de usuário para:', u.id);

    try {
      // 1) Preferência: role “oficial” na tabela user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', u.id)
        .maybeSingle();

      if (roleError) {
        console.error('[AuthContext] ❌ Erro ao buscar role:', roleError.message);
        // Se a consulta falhar por RLS/config, ainda tentamos inferir pelo metadata
        return inferRoleFromMetadata(u);
      }

      if (roleData?.role) {
        console.log('[AuthContext] ✅ Role encontrada (user_roles):', roleData.role);
        return roleData.role as 'master' | 'admin' | 'manager' | 'barber' | 'client';
      }

      // 2) Fallback: inferir via user_metadata (resolve o caso “login ok mas não entra no painel”)
      const inferred = inferRoleFromMetadata(u);
      if (inferred) {
        console.warn('[AuthContext] ⚠️ Usuário sem role na user_roles; usando role via user_metadata:', inferred);
        return inferred;
      }

      console.warn('[AuthContext] ⚠️ Usuário sem role na user_roles e sem user_type no metadata');
      return null;
    } catch (error: any) {
      console.error('[AuthContext] ❌ Erro ao verificar roles:', error.message);
      return inferRoleFromMetadata(u);
    }
  };

  useEffect(() => {
    let mounted = true;
    let roleCheckTimeout: NodeJS.Timeout | null = null;

    // CRÍTICO: Setup do listener PRIMEIRO para capturar todos os eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        
        console.log('[AuthContext] 🔔 Auth event:', event);
        
        // SEMPRE atualiza a session primeiro (síncrono)
        setSession(currentSession);
        
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] 👋 Usuário deslogado');
          setUser(null);
          applyRole(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          if (currentSession?.user) {
            console.log('[AuthContext] ✅ Sessão ativa:', event, '- User:', currentSession.user.email);
            setUser(currentSession.user);
            
            // Limpar timeout anterior se existir
            if (roleCheckTimeout) {
              clearTimeout(roleCheckTimeout);
            }
            
            // CRÍTICO: Usar setTimeout para evitar deadlock com async no callback
            roleCheckTimeout = setTimeout(async () => {
              if (!mounted) return;
              try {
                console.log('[AuthContext] 🔍 Buscando role para:', currentSession.user.id);
                const role = await checkUserRoles(currentSession.user);
                console.log('[AuthContext] ✅ Role encontrada:', role);
                if (mounted) {
                  applyRole(role);
                  setLoading(false);
                }
              } catch (error) {
                console.error('[AuthContext] ❌ Erro ao verificar role:', error);
                if (mounted) {
                  applyRole(null);
                  setLoading(false);
                }
              }
            }, 0);
          } else if (event === 'INITIAL_SESSION') {
            // Sessão inicial sem usuário - não está logado
            console.log('[AuthContext] ℹ️ INITIAL_SESSION sem usuário');
            setLoading(false);
            setRolesChecked(true);
          }
        }
      }
    );

    // Timeout de segurança: se após 5 segundos ainda não terminou, forçar loading=false
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[AuthContext] ⚠️ Safety timeout atingido - forçando loading=false');
        setLoading(false);
        setRolesChecked(true);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
      if (roleCheckTimeout) {
        clearTimeout(roleCheckTimeout);
      }
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

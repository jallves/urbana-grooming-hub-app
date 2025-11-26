
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/hooks/useSessionManager';
import '@/utils/authDebug'; // Importar utilitários de debug

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isMaster: boolean;
  isManager: boolean;
  userRole: 'master' | 'admin' | 'manager' | 'barber' | null;
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

// Cache de roles em localStorage para recuperação rápida
const ROLE_CACHE_KEY = 'user_role_cache';
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface RoleCache {
  userId: string;
  role: 'master' | 'admin' | 'manager' | 'barber' | null;
  timestamp: number;
}

const getRoleFromCache = (userId: string): 'master' | 'admin' | 'manager' | 'barber' | null => {
  try {
    const cached = localStorage.getItem(ROLE_CACHE_KEY);
    if (!cached) return null;
    
    const cacheData: RoleCache = JSON.parse(cached);
    
    // Verificar se o cache é do mesmo usuário e ainda válido
    if (cacheData.userId === userId && Date.now() - cacheData.timestamp < ROLE_CACHE_DURATION) {
      console.log('[AuthContext] 🎯 Role recuperado do cache:', cacheData.role);
      return cacheData.role;
    }
    
    return null;
  } catch (error) {
    console.error('[AuthContext] ❌ Erro ao ler cache:', error);
    return null;
  }
};

const saveRoleToCache = (userId: string, role: 'master' | 'admin' | 'manager' | 'barber' | null) => {
  try {
    const cacheData: RoleCache = {
      userId,
      role,
      timestamp: Date.now()
    };
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(cacheData));
    console.log('[AuthContext] 💾 Role salvo em cache:', role);
  } catch (error) {
    console.error('[AuthContext] ❌ Erro ao salvar cache:', error);
  }
};

const clearRoleCache = () => {
  try {
    localStorage.removeItem(ROLE_CACHE_KEY);
    console.log('[AuthContext] 🗑️ Cache de role limpo');
  } catch (error) {
    console.error('[AuthContext] ❌ Erro ao limpar cache:', error);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBarber, setIsBarber] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userRole, setUserRole] = useState<'master' | 'admin' | 'manager' | 'barber' | null>(null);
  const [rolesChecked, setRolesChecked] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const applyRole = (role: 'master' | 'admin' | 'manager' | 'barber' | null) => {
    console.log('[AuthContext] 🎭 === APLICANDO ROLE ===');
    console.log('[AuthContext] 🎭 Role recebido:', role);
    
    setUserRole(role);
    setIsMaster(role === 'master');
    setIsAdmin(role === 'admin' || role === 'master');
    setIsManager(role === 'manager');
    setIsBarber(role === 'barber');
    setRolesChecked(true);
    
    console.log('[AuthContext] 🎭 Roles aplicados:');
    console.log('[AuthContext] 🎭   - Master:', role === 'master');
    console.log('[AuthContext] 🎭   - Admin:', role === 'admin' || role === 'master');
    console.log('[AuthContext] 🎭   - Manager:', role === 'manager');
    console.log('[AuthContext] 🎭   - Barber:', role === 'barber');
    console.log('[AuthContext] 🎭 === FIM APLICAÇÃO ===');
  };

  const checkUserRoles = async (user: User): Promise<'master' | 'admin' | 'manager' | 'barber' | null> => {
    if (!user) {
      console.log('[AuthContext] ❌ Sem usuário, resetando roles');
      applyRole(null);
      return null;
    }
    
    console.log('[AuthContext] 🔍 Verificando role para:', user.email, 'User ID:', user.id);
    
    // Check cache first
    const cachedRole = getRoleFromCache(user.id);
    if (cachedRole) {
      console.log('[AuthContext] 📦 ✅ Usando cache:', cachedRole);
      applyRole(cachedRole);
      setLoading(false);
      setRolesChecked(true);
      return cachedRole;
    }

    console.log('[AuthContext] 📦 Cache não encontrado, consultando banco...');
    
    try {
      console.log('[AuthContext] 📡 Iniciando consulta (timeout: 8s)...');
      const startTime = Date.now();
      
      // Timeout de 8 segundos (compatível com instâncias Supabase free tier)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => {
          console.error('[AuthContext] ⏰ TIMEOUT após 8s');
          reject(new Error('Query timeout'));
        }, 8000)
      );
      
      // Consulta com maybeSingle() para evitar erro se não encontrar
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      
      const queryTime = Date.now() - startTime;
      console.log(`[AuthContext] ⏱️ Consulta completou em ${queryTime}ms`);

      if (error) {
        console.error('[AuthContext] ❌ Erro na consulta:', error);
        applyRole(null);
        setLoading(false);
        setRolesChecked(true);
        return null;
      }

      if (data?.role) {
        const role = data.role as 'master' | 'admin' | 'manager' | 'barber';
        console.log('[AuthContext] ✅ Role encontrada:', role);
        saveRoleToCache(user.id, role);
        applyRole(role);
        setLoading(false);
        setRolesChecked(true);
        return role;
      }

      console.log('[AuthContext] ℹ️ Nenhuma role encontrada');
      applyRole(null);
      setLoading(false);
      setRolesChecked(true);
      return null;

    } catch (error: any) {
      console.error('[AuthContext] ❌ Erro/timeout:', error.message);
      applyRole(null);
      setLoading(false);
      setRolesChecked(true);
      return null;
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    console.log('[AuthContext] 🚀 Inicializando autenticação...');
    
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] 📋 Passo 1: Obtendo sessão...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthContext] ❌ Erro ao obter sessão:', sessionError);
          if (mounted) {
            setLoading(false);
            setRolesChecked(true);
          }
          return;
        }

        if (!session?.user) {
          console.log('[AuthContext] ℹ️ Nenhuma sessão encontrada');
          if (mounted) {
            setUser(null);
            setLoading(false);
            setRolesChecked(true);
          }
          return;
        }

        console.log('[AuthContext] ✅ Sessão encontrada para:', session.user.email);
        if (mounted) {
          setUser(session.user);
          console.log('[AuthContext] 📋 Passo 2: Verificando roles...');
          await checkUserRoles(session.user);
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Erro crítico na inicialização:', error);
        if (mounted) {
          setLoading(false);
          setRolesChecked(true);
        }
      }
    };

    // Set up auth state listener
    console.log('[AuthContext] 🎧 Configurando listener de auth...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log(`[AuthContext] 🔄 Auth event: ${event}`);
        
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] 🚪 Usuário deslogado - limpando estados');
          setUser(null);
          applyRole(null);
          setLoading(false);
          setRolesChecked(true);
          clearRoleCache();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('[AuthContext] ✅ Usuário logado/token atualizado:', session.user.email);
            console.log('[AuthContext] 📝 Setando user no state...');
            setUser(session.user);
            console.log('[AuthContext] 🔍 Iniciando checkUserRoles...');
            await checkUserRoles(session.user);
            console.log('[AuthContext] ✅ checkUserRoles concluído');
          }
        } else if (event === 'USER_UPDATED') {
          console.log('[AuthContext] 🔄 Usuário atualizado');
          if (session?.user) {
            setUser(session.user);
          }
        }
      }
    );

    // Initialize
    initializeAuth();

    return () => {
      console.log('[AuthContext] 🧹 Limpando listener de auth');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('[AuthContext] 🚪 Iniciando logout...');
      
      // Limpar estados PRIMEIRO (antes de qualquer coisa que possa falhar)
      setIsAdmin(false);
      setIsBarber(false);
      setIsMaster(false);
      setIsManager(false);
      setUserRole(null);
      setUser(null);
      setRolesChecked(true);
      
      // Limpar cache
      clearRoleCache();
      
      // Invalidar sessão (não bloqueante - não interrompe o logout se falhar)
      const userType = isBarber ? 'barber' : 'admin';
      sessionManager.invalidateSession(userType).catch(err => 
        console.warn('[AuthContext] ⚠️ Erro ao invalidar sessão (não crítico):', err)
      );
      
      // Fazer logout no Supabase (não crítico - se falhar, usuário já foi deslogado localmente)
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('[AuthContext] ⚠️ Erro no logout do Supabase (não crítico):', error);
        } else {
          console.log('[AuthContext] ✅ Logout do Supabase realizado com sucesso');
        }
      } catch (supabaseError) {
        console.warn('[AuthContext] ⚠️ Erro ao fazer logout no Supabase (não crítico):', supabaseError);
      }
      
      console.log('[AuthContext] ✅ Logout local concluído - usuário deslogado');
    } catch (error) {
      console.error('[AuthContext] ❌ Erro no logout (mas continuando):', error);
      // Mesmo com erro, garantir que estados estão limpos
      setIsAdmin(false);
      setIsBarber(false);
      setIsMaster(false);
      setIsManager(false);
      setUserRole(null);
      setUser(null);
      setRolesChecked(true);
    }
  };

  const canAccessModule = (moduleName: string): boolean => {
    if (!rolesChecked) {
      console.log('[AuthContext] ⏳ canAccessModule - Roles ainda não verificados, aguardando...');
      return false;
    }
    
    console.log('[AuthContext] 🔍 canAccessModule - Verificando acesso ao módulo:', moduleName, 'Role atual:', userRole);
    
    if (!userRole) {
      console.warn('[AuthContext] ⚠️ canAccessModule - Role não definido, negando acesso');
      return false;
    }
    
    // Master tem acesso total
    if (userRole === 'master') {
      console.log('[AuthContext] ✅ canAccessModule - Master tem acesso total');
      return true;
    }
    
    // Admin tem acesso a tudo exceto configurações
    if (userRole === 'admin') {
      const hasAccess = moduleName !== 'configuracoes';
      console.log('[AuthContext] 🔐 canAccessModule - Admin:', hasAccess ? 'acesso permitido' : 'acesso negado (configurações)');
      return hasAccess;
    }
    
    // Manager tem restrições em financeiro e configurações
    if (userRole === 'manager') {
      const hasAccess = moduleName !== 'financeiro' && moduleName !== 'configuracoes';
      console.log('[AuthContext] 🔐 canAccessModule - Manager:', hasAccess ? 'acesso permitido' : `acesso negado (${moduleName})`);
      return hasAccess;
    }
    
    // Barber não tem acesso aos módulos administrativos
    console.log('[AuthContext] ❌ canAccessModule - Barber não tem acesso a módulos admin');
    return false;
  };

  const value = {
    user,
    loading,
    isAdmin,
    isBarber,
    isMaster,
    isManager,
    userRole,
    rolesChecked,
    requiresPasswordChange,
    canAccessModule,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider as default };


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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] 🚀 Inicializando autenticação...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthContext] ❌ Erro ao obter sessão:', sessionError);
          throw sessionError;
        }
        
        if (!mounted) return;

        if (session?.user) {
          console.log('[AuthContext] 👤 Usuário encontrado:', session.user.email);
          setUser(session.user);
          const role = await checkUserRoles(session.user);
          
          // Criar sessão (não bloqueante - não interrompe o login se falhar)
          sessionManager.createSession({
            userId: session.user.id,
            userType: (role === 'barber' ? 'barber' : 'admin') as any,
            userEmail: session.user.email,
            userName: session.user.email,
            expiresInHours: 24,
          }).catch(err => console.warn('[AuthContext] ⚠️ Erro ao criar sessão (não crítico):', err));
        } else {
          console.log('[AuthContext] 👤 Nenhuma sessão ativa');
          setUser(null);
          setIsAdmin(false);
          setIsBarber(false);
          setIsMaster(false);
          setIsManager(false);
          setUserRole(null);
          setRolesChecked(true);
        }
        
        setLoading(false);
        console.log('[AuthContext] ✅ Inicialização completa');
      } catch (error) {
        console.error('[AuthContext] ❌ Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
          setRolesChecked(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('[AuthContext] 🔄 Auth state changed:', event);
      
      if (session?.user) {
        setUser(session.user);
        // Não aguardar verificação de roles para não bloquear navegação
        checkUserRoles(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsBarber(false);
        setIsMaster(false);
        setIsManager(false);
        setUserRole(null);
        setRolesChecked(true);
        clearRoleCache();
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRoles = async (user: User): Promise<'master' | 'admin' | 'manager' | 'barber' | null> => {
    if (!user) {
      console.log('[AuthContext] ❌ Sem usuário, resetando roles');
      setIsAdmin(false);
      setIsBarber(false);
      setIsMaster(false);
      setIsManager(false);
      setUserRole(null);
      setRolesChecked(true);
      setRequiresPasswordChange(false);
      return null;
    }
    
    console.log('[AuthContext] 🔍 Verificando role para:', user.email, 'User ID:', user.id);
    
    // PRIMEIRO: Verificar localStorage para ver o cache
    const cachedData = localStorage.getItem(ROLE_CACHE_KEY);
    console.log('[AuthContext] 📦 Cache atual no localStorage:', cachedData);
    
    // SEGUNDO: Tentar carregar do cache para acesso imediato
    const cachedRole = getRoleFromCache(user.id);
    if (cachedRole) {
      console.log('[AuthContext] ⚡ Usando role do cache:', cachedRole);
      applyRole(cachedRole);
      // Continuar verificação em background para atualizar cache
    } else {
      console.log('[AuthContext] 📦 Nenhum cache encontrado ou cache expirado, buscando do banco...');
    }
    
    try {
      // Buscar role diretamente da tabela com retry
      let role: 'master' | 'admin' | 'manager' | 'barber' | null = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !role) {
        attempts++;
        console.log(`[AuthContext] 📡 Tentativa ${attempts}/${maxAttempts} de buscar role...`);
        
        try {
          console.log('[AuthContext] 🔍 Executando query user_roles para user_id:', user.id);
          console.log('[AuthContext] 🔍 Timestamp:', new Date().toISOString());
          
          const queryStart = performance.now();
          
          // Adicionar timeout de 5 segundos para evitar travamento
          const queryPromise = supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .order('role', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          );
          
          const { data: userRoleData, error: userRoleError } = await Promise.race([
            queryPromise,
            timeoutPromise
          ]) as any;
          
          const queryEnd = performance.now();

          console.log('[AuthContext] 📊 Query completou em:', (queryEnd - queryStart).toFixed(2), 'ms');
          console.log('[AuthContext] 📊 Resposta COMPLETA:', { 
            data: userRoleData, 
            error: userRoleError,
            hasData: !!userRoleData,
            hasError: !!userRoleError,
            dataType: typeof userRoleData,
            errorType: typeof userRoleError
          });
          
          if (userRoleData) {
            console.log('[AuthContext] ✅ DADOS RECEBIDOS:', JSON.stringify(userRoleData));
          }

          if (userRoleError) {
            console.error(`[AuthContext] ⚠️ ERRO DETECTADO na tentativa ${attempts}:`, userRoleError);
            console.error(`[AuthContext] ⚠️ Erro code:`, userRoleError.code);
            console.error(`[AuthContext] ⚠️ Erro message:`, userRoleError.message);
            console.error(`[AuthContext] ⚠️ Erro details:`, userRoleError.details);
            console.error(`[AuthContext] ⚠️ Erro hint:`, userRoleError.hint);
            
            if (attempts < maxAttempts) {
              // Aguardar antes de tentar novamente (backoff exponencial)
              const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
              console.log(`[AuthContext] ⏳ Aguardando ${delay}ms antes de retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              throw userRoleError;
            }
          }

          if (userRoleData?.role) {
            role = userRoleData.role as 'master' | 'admin' | 'manager' | 'barber';
            console.log('[AuthContext] ✅ ✅ ✅ ROLE OBTIDO DO BANCO:', role, 'User ID:', user.id);
            console.log('[AuthContext] ✅ Role type:', typeof role);
            console.log('[AuthContext] ✅ Role value:', role);
            break;
          } else {
            console.log('[AuthContext] ⚠️ NENHUMA ROLE encontrada no banco para user_id:', user.id);
            console.log('[AuthContext] ⚠️ userRoleData:', userRoleData);
            console.log('[AuthContext] ⚠️ userRoleData?.role:', userRoleData?.role);
            break;
          }
        } catch (attemptError) {
          console.error(`[AuthContext] ❌ Erro na tentativa ${attempts}:`, attemptError);
          
          // Se for timeout ou última tentativa, não retente
          if ((attemptError as any)?.message === 'Query timeout' || attempts >= maxAttempts) {
            console.log('[AuthContext] ⚠️ Timeout ou max attempts - assumindo usuário sem role de admin/staff');
            break;
          }
          
          // Aguardar antes de tentar novamente
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
          console.log(`[AuthContext] ⏳ Aguardando ${delay}ms antes de retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Aplicar role obtido
      console.log('[AuthContext] 🎯 Aplicando role obtido do banco:', role);
      applyRole(role);
      
      // Salvar em cache para próxima vez
      if (role) {
        saveRoleToCache(user.id, role);
      }

      // Verificar se precisa trocar senha
      if (role && role !== 'master') {
        try {
          const { data: employeeData } = await supabase
            .from('employees')
            .select('requires_password_change')
            .eq('user_id', user.id)
            .maybeSingle();

          setRequiresPasswordChange(employeeData?.requires_password_change === true);
        } catch (error) {
          console.error('[AuthContext] ⚠️ Erro ao verificar troca de senha:', error);
          setRequiresPasswordChange(false);
        }
      } else {
        setRequiresPasswordChange(false);
      }
      
      console.log('[AuthContext] ✅ Verificação completa - Role:', role);
      return role;
    } catch (error) {
      console.error('[AuthContext] ❌ Erro ao verificar roles:', error);
      
      // CRÍTICO: Sempre setar rolesChecked mesmo em caso de erro
      // para não bloquear usuários que não são admin/staff
      if (cachedRole) {
        console.warn('[AuthContext] ⚠️ Mantendo role do cache devido a erro:', cachedRole);
        applyRole(cachedRole);
        return cachedRole;
      } else {
        console.log('[AuthContext] ℹ️ Sem cache e sem role encontrado - assumindo usuário comum (cliente)');
        applyRole(null);
        return null;
      }
    } finally {
      // Garantir que rolesChecked sempre seja true
      setRolesChecked(true);
      setRequiresPasswordChange(false);
    }
  };

  const applyRole = (role: 'master' | 'admin' | 'manager' | 'barber' | null) => {
    console.log('[AuthContext] 🎭 === APLICANDO ROLE ===');
    console.log('[AuthContext] 🎭 Role recebido:', role);
    
    setUserRole(role);
    setIsMaster(role === 'master');
    setIsAdmin(role === 'admin' || role === 'master');
    setIsManager(role === 'manager');
    setIsBarber(role === 'barber');
    setRolesChecked(true); // CRÍTICO: Marcar como verificado imediatamente após aplicar
    
    console.log('[AuthContext] 🎭 Roles aplicados:');
    console.log('[AuthContext] 🎭   - Master:', role === 'master');
    console.log('[AuthContext] 🎭   - Admin:', role === 'admin' || role === 'master');
    console.log('[AuthContext] 🎭   - Manager:', role === 'manager');
    console.log('[AuthContext] 🎭   - Barber:', role === 'barber');
    console.log('[AuthContext] 🎭   - RolesChecked: true');
    console.log('[AuthContext] 🎭 === FIM APLICAÇÃO ===');
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] 🚪 Iniciando logout...');
      
      // Invalidar sessão (não bloqueante - não interrompe o logout se falhar)
      const userType = isBarber ? 'barber' : 'admin';
      sessionManager.invalidateSession(userType).catch(err => 
        console.warn('[AuthContext] ⚠️ Erro ao invalidar sessão (não crítico):', err)
      );
      
      // Limpar cache
      clearRoleCache();
      
      // Limpar estados
      setIsAdmin(false);
      setIsBarber(false);
      setIsMaster(false);
      setIsManager(false);
      setUserRole(null);
      setUser(null);
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] ❌ Erro no logout:', error);
        throw error;
      }
      
      console.log('[AuthContext] ✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('[AuthContext] ❌ Error signing out:', error);
      throw error;
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

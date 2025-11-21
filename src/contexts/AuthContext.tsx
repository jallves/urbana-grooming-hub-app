
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
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] 🔄 Inicializando autenticação...');
        
        // Timeout de segurança: se demorar mais de 10 segundos, desistir
        initTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('[AuthContext] ⚠️ Timeout na inicialização, definindo loading=false');
            setLoading(false);
          }
        }, 10000);

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setUser(session?.user || null);
        
        if (session?.user) {
          console.log('[AuthContext] 👤 Usuário encontrado, verificando roles...');
          await checkUserRoles(session.user);
        } else {
          console.log('[AuthContext] 👤 Nenhum usuário encontrado');
          setIsAdmin(false);
          setIsBarber(false);
          setRolesChecked(true);
        }
        
        clearTimeout(initTimeout);
        setLoading(false);
        console.log('[AuthContext] ✅ Inicialização completa');
      } catch (error) {
        console.error('[AuthContext] ❌ Error initializing auth:', error);
        if (mounted) {
          setIsAdmin(false);
          setIsBarber(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('[AuthContext] 🔄 Auth state changed:', event);
      
      setUser(session?.user || null);
      
      if (session?.user) {
        await checkUserRoles(session.user);
      } else {
        setIsAdmin(false);
        setIsBarber(false);
        setRolesChecked(true);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (initTimeout) clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRoles = async (user: User) => {
    if (!user) {
      setIsAdmin(false);
      setIsBarber(false);
      setIsMaster(false);
      setIsManager(false);
      setUserRole(null);
      setRolesChecked(true);
      setRequiresPasswordChange(false);
      return;
    }
    
    console.log('[AuthContext] 🔄 Verificando role único do usuário...');
    setRolesChecked(false);
    
    try {
      console.log('[AuthContext] 🔍 Buscando role para:', user.id, user.email);
      
      // Usar a nova função simplificada que retorna apenas UM role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { p_user_id: user.id });

      if (roleError) {
        console.error('[AuthContext] ❌ Erro ao buscar role:', roleError);
        throw roleError;
      }

      const role = roleData as 'master' | 'admin' | 'manager' | 'barber' | null;
      
      console.log('[AuthContext] ✅ Role obtido:', role);
      
      // Definir flags baseadas no role
      setUserRole(role);
      setIsMaster(role === 'master');
      setIsAdmin(role === 'admin' || role === 'master');
      setIsManager(role === 'manager');
      setIsBarber(role === 'barber');

      // Verificar se precisa trocar senha (apenas se não for master)
      if (role !== 'master') {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('requires_password_change')
          .eq('user_id', user.id)
          .maybeSingle();

        setRequiresPasswordChange(employeeData?.requires_password_change === true);
      } else {
        setRequiresPasswordChange(false);
      }
      
      setRolesChecked(true);
      console.log('[AuthContext] ✅ Verificação completa - Master:', role === 'master', 'Admin:', role === 'admin' || role === 'master', 'Manager:', role === 'manager', 'Barber:', role === 'barber');
    } catch (error) {
      console.error('[AuthContext] ❌ Error checking user roles:', error);
      setIsAdmin(false);
      setIsBarber(false);
      setIsMaster(false);
      setIsManager(false);
      setUserRole(null);
      setRequiresPasswordChange(false);
      setRolesChecked(true);
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] 🚪 Iniciando logout...');
      
      // Limpar estados ANTES do signOut para evitar race conditions
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

  // Função simplificada para verificar acesso a módulos
  const canAccessModule = (moduleName: string): boolean => {
    if (!userRole) return false;
    
    // Master tem acesso total
    if (userRole === 'master') return true;
    
    // Admin tem acesso a tudo exceto configurações
    if (userRole === 'admin') return moduleName !== 'configuracoes';
    
    // Manager tem restrições em financeiro e configurações
    if (userRole === 'manager') {
      return moduleName !== 'financeiro' && moduleName !== 'configuracoes';
    }
    
    // Barber não tem acesso aos módulos administrativos
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

// Export both named and default
export { AuthProvider as default };

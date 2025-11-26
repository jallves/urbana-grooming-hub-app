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

  const applyRole = (role: 'master' | 'admin' | 'manager' | 'barber' | null) => {
    setUserRole(role);
    setIsMaster(role === 'master');
    setIsAdmin(role === 'admin' || role === 'master');
    setIsManager(role === 'manager');
    setIsBarber(role === 'barber');
    setRolesChecked(true);
  };

  const checkUserRoles = async (userId: string): Promise<'master' | 'admin' | 'manager' | 'barber' | null> => {
    console.log('[AuthContext] 🔍 Verificando tipo de usuário para:', userId);
    
    try {
      // 1. Verificar se é cliente (clientes não têm roles)
      // Buscar em client_profiles que é a tabela correta para clientes
      const { data: clientData } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (clientData) {
        console.log('[AuthContext] ✅ Usuário identificado como CLIENTE - sem roles administrativas');
        return null;
      }

      // 2. Verificar se é staff/employee
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;

      if (!userEmail) {
        console.warn('[AuthContext] ⚠️ Email não encontrado');
        return null;
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (!staffData) {
        console.log('[AuthContext] ℹ️ Usuário não é staff ativo (provavelmente é cliente)');
        return null;
      }

      // 3. Buscar role apenas se for staff
      console.log('[AuthContext] 🔍 Usuário é staff - buscando role...');
      
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => 
        setTimeout(() => resolve({ 
          data: null, 
          error: new Error('Timeout') 
        }), 3000)
      );

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result;

      if (error) {
        console.error('[AuthContext] ❌ Erro ao buscar role:', error.message);
        return null;
      }

      if (!data) {
        console.warn('[AuthContext] ⚠️ Staff sem role na user_roles');
        return null;
      }

      console.log('[AuthContext] ✅ Role encontrada:', data.role);
      return data.role as 'master' | 'admin' | 'manager' | 'barber';
    } catch (error: any) {
      console.error('[AuthContext] ❌ Erro ao verificar roles:', error.message);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const role = await checkUserRoles(session.user.id);
          if (mounted) {
            applyRole(role);
            setLoading(false);
          }
        } else {
          setLoading(false);
          setRolesChecked(true);
        }
      } catch (error) {
        console.error('[AuthContext] Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
          setRolesChecked(true);
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
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsAdmin(false);
    setIsBarber(false);
    setIsMaster(false);
    setIsManager(false);
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
    userRole,
    rolesChecked,
    requiresPasswordChange,
    canAccessModule,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider as default };

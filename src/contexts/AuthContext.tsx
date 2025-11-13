
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  rolesChecked: boolean;
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
  const [rolesChecked, setRolesChecked] = useState(false);

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
      setRolesChecked(true);
      return;
    }
    
    try {
      console.log('[AuthContext] 🔍 Verificando roles para usuário:', user.id, user.email);
      
      // Timeout de 5 segundos para evitar loops infinitos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout verificando roles')), 5000)
      );
      
      const checkRolesPromise = async () => {
        // Usar funções SECURITY DEFINER do banco para evitar problemas de RLS
        const { data: isAdminData, error: adminError } = await supabase
          .rpc('is_admin' as any, { user_id: user.id });

        const { data: isBarberData, error: barberError } = await supabase
          .rpc('is_barber' as any, { user_id: user.id });

        if (adminError) throw adminError;
        if (barberError) throw barberError;

        return {
          isAdmin: isAdminData === true,
          isBarber: isBarberData === true
        };
      };

      const roles = await Promise.race([checkRolesPromise(), timeoutPromise]) as { isAdmin: boolean; isBarber: boolean };
      
      console.log('[AuthContext] ✅ Roles definidas - isAdmin:', roles.isAdmin, 'isBarber:', roles.isBarber);
      
      setIsAdmin(roles.isAdmin);
      setIsBarber(roles.isBarber);
      setRolesChecked(true);
    } catch (error) {
      console.error('[AuthContext] ❌ Error checking user roles:', error);
      // Em caso de erro, assumir que não é admin nem barber
      setIsAdmin(false);
      setIsBarber(false);
      setRolesChecked(true);
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] 🚪 Iniciando logout...');
      
      // Limpar estados ANTES do signOut para evitar race conditions
      setIsAdmin(false);
      setIsBarber(false);
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

  const value = {
    user,
    loading,
    isAdmin,
    isBarber,
    rolesChecked,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export both named and default
export { AuthProvider as default };

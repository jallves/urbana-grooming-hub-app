
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isBarber: boolean;
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user || null);
          if (session?.user) {
            // Check roles before setting loading to false
            await checkUserRoles(session.user);
          } else {
            setIsAdmin(false);
            setIsBarber(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setUser(session?.user || null);
      if (session?.user) {
        // Check roles before updating loading state
        await checkUserRoles(session.user);
      } else {
        setIsAdmin(false);
        setIsBarber(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRoles = async (user: User) => {
    if (!user) return;
    
    try {
      console.log('[AuthContext] 🔍 Verificando roles para usuário:', user.id, user.email);
      
      // Usar funções SECURITY DEFINER do banco para evitar problemas de RLS
      const { data: isAdminData, error: adminError } = await supabase
        .rpc('is_admin' as any, { user_id: user.id });

      const { data: isBarberData, error: barberError } = await supabase
        .rpc('is_barber' as any, { user_id: user.id });

      if (adminError) console.error('[AuthContext] Erro ao verificar admin:', adminError);
      if (barberError) console.error('[AuthContext] Erro ao verificar barber:', barberError);

      const isAdminUser = isAdminData === true;
      const isBarberUser = isBarberData === true;
      
      console.log('[AuthContext] ✅ Roles definidas - isAdmin:', isAdminUser, 'isBarber:', isBarberUser);
      
      setIsAdmin(isAdminUser);
      setIsBarber(isBarberUser);
    } catch (error) {
      console.error('[AuthContext] ❌ Error checking user roles:', error);
      setIsAdmin(false);
      setIsBarber(false);
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
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export both named and default
export { AuthProvider as default };

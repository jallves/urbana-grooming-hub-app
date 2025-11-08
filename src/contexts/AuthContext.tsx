
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
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(session?.user || null);
          if (session?.user) {
            await checkUserRoles(session.user);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user || null);
        
        if (session?.user) {
          await checkUserRoles(session.user);
        } else {
          setIsAdmin(false);
          setIsBarber(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRoles = async (user: User) => {
    if (!user) return;
    
    try {
      console.log('[AuthContext] 🔍 Verificando roles para usuário:', user.id, user.email);
      
      // Check admin role
      const { data: adminRole, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      console.log('[AuthContext] Admin role encontrada:', adminRole, 'Erro:', adminError);

      // Check barber role - both from user_roles and painel_barbeiros
      const { data: barberRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'barber')
        .maybeSingle();

      const { data: barberData } = await supabase
        .from('painel_barbeiros')
        .select('id')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      const isAdminUser = !!adminRole;
      const isBarberUser = !!barberRole || !!barberData;
      
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

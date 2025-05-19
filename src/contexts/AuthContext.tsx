
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user' | 'barber';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isBarber: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isBarber, setIsBarber] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('AuthProvider iniciado');

    try {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log('Evento de autenticação:', event);
          
          // Synchronous updates first
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // If user changes, check admin role with timeout to prevent deadlocks
          if (newSession?.user) {
            console.log('Nova sessão, verificando papel do usuário:', newSession.user.email);
            // Use setTimeout to avoid potential deadlocks with Supabase client
            setTimeout(() => {
              checkUserRole(newSession.user.id).catch(err => {
                console.error('Erro ao verificar papel do usuário via timeout:', err);
              });
            }, 0);
          } else {
            console.log('Sessão terminada ou inválida');
            setIsAdmin(false);
            setIsBarber(false);
          }
        }
      );

      // THEN check for existing session
      const getSession = async () => {
        try {
          console.log('Obtendo sessão atual');
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            console.log('Sessão encontrada, verificando papel do usuário:', currentSession.user.email);
            await checkUserRole(currentSession.user.id);
          } else {
            console.log('Nenhuma sessão encontrada');
            setIsAdmin(false);
            setIsBarber(false);
          }
        } catch (error) {
          console.error('Erro ao obter sessão:', error);
        } finally {
          console.log('Carregamento completo');
          setLoading(false);
        }
      };

      getSession();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Erro crítico no AuthProvider:', error);
      setLoading(false);
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsBarber(false);
    }
  }, []);

  // Verificar se o usuário tem papel de administrador ou barbeiro
  const checkUserRole = async (userId: string) => {
    try {
      console.log('Verificando roles para usuário:', userId);
      
      // Verificar se temos userId antes de consultar
      if (!userId) {
        console.log('userId vazio, não é possível verificar roles');
        setIsAdmin(false);
        setIsBarber(false);
        return;
      }
      
      // Verificação especial para o email específico
      const { data: userData } = await supabase.auth.getUser();
      
      // Special check for specific emails - FIXED to match exact emails
      if (userData?.user?.email === 'joao.colimoides@gmail.com' || 
          userData?.user?.email === 'jhoaoallves84@gmail.com') {
        console.log('Usuário especial detectado, configurando acesso apropriado:', userData.user.email);
        
        // Set roles based on special user email
        if (userData?.user?.email === 'joao.colimoides@gmail.com') {
          setIsAdmin(true);
          setIsBarber(false);
        } else if (userData?.user?.email === 'jhoaoallves84@gmail.com') {
          setIsAdmin(false);
          setIsBarber(true);
        }
        
        // Add appropriate role to database if needed
        const role = userData?.user?.email === 'joao.colimoides@gmail.com' ? 'admin' : 'barber';
        
        try {
          // Check if role already exists
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .eq('role', role)
            .maybeSingle();
          
          // Insert role if it doesn't exist
          if (!existingRole) {
            console.log(`Inserindo role de ${role} para usuário especial`);
            await supabase
              .from('user_roles')
              .insert([{ user_id: userId, role: role }]);
          }
        } catch (error) {
          console.error(`Erro ao verificar/inserir role:`, error);
          // Continue anyway since we're setting the role in state
        }
        
        return;
      }
      
      // Regular role check for other users
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Erro ao verificar papel do usuário:', error);
        setIsAdmin(false);
        setIsBarber(false);
        return;
      }
      
      console.log('Roles do usuário:', roles);
      
      // Verificar se tem role de admin ou barber
      const hasAdminRole = roles?.some(role => role.role === 'admin');
      const hasBarberRole = roles?.some(role => role.role === 'barber');
      
      console.log('Usuário é admin:', hasAdminRole, 'É barbeiro:', hasBarberRole, 'Email:', userData?.user?.email);
      
      setIsAdmin(hasAdminRole);
      setIsBarber(hasBarberRole);
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      setIsAdmin(false);
      setIsBarber(false);
    }
  };

  const signOut = async () => {
    console.log('Iniciando logout');
    try {
      await supabase.auth.signOut();
      console.log('Logout concluído');
      setIsAdmin(false);
      setIsBarber(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const contextValue = {
    session,
    user,
    isAdmin,
    isBarber,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

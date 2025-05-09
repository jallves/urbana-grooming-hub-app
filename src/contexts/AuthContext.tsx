
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
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
    }
  }, []);

  // Verificar se o usuário tem papel de administrador
  const checkUserRole = async (userId: string) => {
    try {
      console.log('Verificando admin role para usuário:', userId);
      
      // Verificar se temos userId antes de consultar
      if (!userId) {
        console.log('userId vazio, não é possível verificar roles');
        setIsAdmin(false);
        return;
      }
      
      // Verificação especial para o email específico
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email === 'joao.colimoides@gmail.com') {
        console.log('Usuário especial detectado, configurando como admin:', userData.user.email);
        setIsAdmin(true);
        
        // Verificar se já existe o registro de role
        const { data: existingRole, error: roleCheckError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (roleCheckError) {
          console.error('Erro ao verificar role existente:', roleCheckError);
        }
        
        // Inserir role se não existir
        if (!existingRole) {
          console.log('Inserindo role de admin para usuário especial');
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert([{ user_id: userId, role: 'admin' }]);
            
          if (insertError) {
            console.error('Erro ao inserir role de admin:', insertError);
          }
        }
        
        return;
      }
      
      // Buscar todos os registros para este usuário onde o papel seja 'admin'
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) {
        console.error('Erro ao verificar papel do usuário:', error);
        setIsAdmin(false);
        return;
      }
      
      console.log('Resultado da consulta de role:', data);
      
      // Se tiver pelo menos um resultado, o usuário é admin
      const hasAdminRole = data && data.length > 0;
      console.log('Usuário é admin:', hasAdminRole, 'Email:', userData?.user?.email);
      
      setIsAdmin(hasAdminRole);
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    console.log('Iniciando logout');
    try {
      await supabase.auth.signOut();
      console.log('Logout concluído');
      setIsAdmin(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const contextValue = {
    session,
    user,
    isAdmin,
    loading,
    signOut
  };

  console.log('Estado do contexto de autenticação:', {
    isLoggedIn: !!user,
    userEmail: user?.email,
    isAdmin,
    loading
  });

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

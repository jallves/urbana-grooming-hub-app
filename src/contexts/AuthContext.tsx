
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

    // Verificar sessão atual primeiro
    const getSession = async () => {
      try {
        console.log('Obtendo sessão atual');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log('Sessão encontrada, verificando papel do usuário');
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

    // Configurar o listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Evento de autenticação:', event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Verificar se o usuário é admin quando a sessão mudar
        if (newSession?.user) {
          console.log('Nova sessão, verificando papel do usuário');
          await checkUserRole(newSession.user.id);
        } else {
          console.log('Sessão terminada ou inválida');
          setIsAdmin(false);
        }
      }
    );

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Verificar se o usuário tem papel de administrador
  const checkUserRole = async (userId: string) => {
    try {
      console.log('Verificando admin role para usuário:', userId);
      
      // Buscar todos os registros para este usuário onde o papel seja 'admin'
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      console.log('Resultado da consulta:', data);
      
      // Se tiver pelo menos um resultado, o usuário é admin
      const hasAdminRole = data && data.length > 0;
      console.log('Usuário é admin:', hasAdminRole);
      
      setIsAdmin(hasAdminRole);
      
      if (error) {
        console.error('Erro ao verificar papel do usuário:', error);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    console.log('Iniciando logout');
    await supabase.auth.signOut();
    console.log('Logout concluído');
    setIsAdmin(false);
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

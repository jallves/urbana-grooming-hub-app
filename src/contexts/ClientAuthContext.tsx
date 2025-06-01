
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Client } from '@/types/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput } from '@/lib/security';

interface ClientAuthContextType {
  client: Client | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: ClientSignUpData) => Promise<{ error: string | null }>;
  signIn: (data: ClientLoginData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateClient: (data: Partial<Client>) => Promise<{ error: string | null }>;
}

interface ClientSignUpData {
  name: string;
  email: string;
  phone: string;
  birth_date?: string;
  password: string;
  confirmPassword: string;
}

interface ClientLoginData {
  email: string;
  password: string;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}

interface ClientAuthProviderProps {
  children: ReactNode;
}

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClientProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil do cliente para:', userId);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil do cliente:', error);
        return null;
      }

      if (data) {
        console.log('Perfil do cliente encontrado:', data);
        return data;
      } else {
        console.log('Perfil do cliente não encontrado para ID:', userId);
        return null;
      }
    } catch (error) {
      console.error('Erro na busca do perfil do cliente:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Inicializando autenticação do cliente...');
        
        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth event:', event, newSession?.user?.email);
            
            if (!mounted) return;
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (newSession?.user && event !== 'SIGNED_OUT') {
              // Fetch client profile in background
              const clientData = await fetchClientProfile(newSession.user.id);
              if (mounted) {
                setClient(clientData);
              }
            } else {
              setClient(null);
            }
            
            if (mounted) {
              setLoading(false);
            }
          }
        );

        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão inicial:', error);
        }

        console.log('Sessão inicial:', initialSession?.user?.email || 'nenhuma');

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            const clientData = await fetchClientProfile(initialSession.user.id);
            if (mounted) {
              setClient(clientData);
            }
          }
          
          setLoading(false);
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (data: ClientSignUpData): Promise<{ error: string | null }> => {
    try {
      const sanitizedData = {
        name: sanitizeInput(data.name),
        email: sanitizeInput(data.email),
        phone: sanitizeInput(data.phone),
        birth_date: data.birth_date ? sanitizeInput(data.birth_date) : undefined,
      };

      if (data.password !== data.confirmPassword) {
        return { error: 'As senhas não coincidem' };
      }

      if (data.birth_date) {
        const birthDate = new Date(data.birth_date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 14) {
          return { error: 'Idade mínima é de 14 anos' };
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: data.password,
        options: {
          data: {
            full_name: sanitizedData.name,
            phone: sanitizedData.phone,
          },
          emailRedirectTo: `${window.location.origin}/cliente/dashboard`
        }
      });

      if (authError) {
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Falha ao criar usuário' };
      }

      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          id: authData.user.id,
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          birth_date: sanitizedData.birth_date || null,
        });

      if (clientError) {
        console.error('Erro ao criar perfil do cliente:', clientError);
        return { error: 'Erro ao criar perfil do cliente' };
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signIn = async (data: ClientLoginData): Promise<{ error: string | null }> => {
    try {
      const sanitizedEmail = sanitizeInput(data.email);

      console.log('Tentativa de login para:', sanitizedEmail);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: data.password,
      });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        return { error: 'Email ou senha incorretos' };
      }

      if (!authData.user) {
        return { error: 'Falha na autenticação' };
      }

      console.log('Login bem-sucedido para:', authData.user.email);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setClient(null);
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const updateClient = async (data: Partial<Client>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = sanitizeInput(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(sanitizedData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      setClient(updatedClient);
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const value = {
    client,
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateClient
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

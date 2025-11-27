
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientLoginData, ClientFormData } from '@/types/client';
import { useToast } from '@/hooks/use-toast';
import { sessionManager } from '@/hooks/useSessionManager';
import { useForceLogoutListener } from '@/hooks/useForceLogoutListener';

interface ClientAuthContextType {
  client: Client | null;
  loading: boolean;
  signUp: (data: ClientFormData) => Promise<{ error: string | null }>;
  signIn: (data: ClientLoginData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  updateClient: (data: Partial<Client>) => Promise<{ error: string | null }>;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ========================================
  // SIGNOUT: Integrado com Supabase Auth
  // ========================================
  const signOut = async (): Promise<void> => {
    console.log('[ClientAuthContext] 🚪 Iniciando logout do cliente...');
    
    try {
      // 1. Fazer logout do Supabase PRIMEIRO (aguardar)
      await supabase.auth.signOut();
      console.log('[ClientAuthContext] ✅ Supabase signOut concluído');
    } catch (err) {
      console.warn('[ClientAuthContext] Erro ao fazer signOut:', err);
    }
    
    // 2. Limpar localStorage
    localStorage.removeItem('client_last_route');
    
    // 3. Limpar estado
    setClient(null);
    setLoading(false);
    
    // 4. Toast
    toast({
      title: "Logout realizado",
      description: "Até a próxima!",
      duration: 2000,
    });

    // 5. Redirecionar
    console.log('[ClientAuthContext] ✅ Logout concluído - redirecionando...');
    window.location.href = '/painel-cliente/login';
  };

  // Usar hook para escutar logout forçado
  useForceLogoutListener(client?.id);

  // Sincronizar com Supabase Auth
  useEffect(() => {
    let mounted = true;

    const syncWithSupabaseAuth = async () => {
      try {
        // Verificar sessão atual do Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          // Buscar dados do cliente na tabela clients
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (clientData && mounted) {
            setClient(clientData);
          }
        } else {
          setClient(null);
        }
      } catch (error) {
        console.error('[ClientAuthContext] Erro ao sincronizar:', error);
        if (mounted) {
          setClient(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[ClientAuthContext] Auth event:', event);

        if (event === 'SIGNED_OUT') {
          setClient(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            // Buscar dados atualizados do cliente
            const { data: clientData } = await supabase
              .from('clients')
              .select('*')
              .eq('email', session.user.email)
              .maybeSingle();

            if (clientData && mounted) {
              setClient(clientData);
            }
          }
        }
      }
    );

    syncWithSupabaseAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ========================================
  // SIGNUP: Integrado com Supabase Auth
  // ========================================
  const signUp = async (data: ClientFormData): Promise<{ error: string | null }> => {
    try {
      console.log('[ClientAuthContext] Iniciando cadastro via Supabase Auth');

      // Validações básicas
      if (!data.name?.trim()) return { error: 'Nome é obrigatório' };
      if (!data.email?.trim()) return { error: 'Email é obrigatório' };
      if (!data.phone?.trim()) return { error: 'Telefone é obrigatório' };
      if (!data.password || data.password.length < 6) {
        return { error: 'Senha deve ter pelo menos 6 caracteres' };
      }
      if (data.password !== data.confirmPassword) {
        return { error: 'As senhas não coincidem' };
      }

      // Verificar se email já existe na tabela clients
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', data.email.trim().toLowerCase())
        .maybeSingle();

      if (existingClient) {
        return { error: 'Este email já está cadastrado' };
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/painel-cliente/dashboard`,
          data: {
            full_name: data.name.trim(),
          }
        }
      });

      if (authError) {
        console.error('[ClientAuthContext] Erro no signup:', authError);
        if (authError.message.includes('already registered')) {
          return { error: 'Este email já está cadastrado' };
        }
        return { error: `Erro ao criar conta: ${authError.message}` };
      }

      if (!authData.user) {
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      // Criar registro na tabela clients (sincronizado)
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert([{
          id: authData.user.id, // Usar mesmo ID do auth.users
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          birth_date: data.birth_date || null,
          whatsapp: data.whatsapp?.trim() || null,
          email_verified: false,
        }])
        .select()
        .single();

      if (clientError) {
        console.error('[ClientAuthContext] Erro ao criar registro de cliente:', clientError);
        // Reverter criação do usuário se falhar
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
        return { error: 'Erro ao finalizar cadastro' };
      }

      // Criar role de client
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          role: 'client'
        }]);

      if (roleError) {
        console.warn('[ClientAuthContext] Role já existe ou erro ao criar:', roleError);
      }

      setClient(newClient);

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo à nossa barbearia.",
      });

      return { error: null };

    } catch (error) {
      console.error('[ClientAuthContext] Erro inesperado no cadastro:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  };

  // ========================================
  // SIGNIN: Integrado com Supabase Auth
  // ========================================
  const signIn = async (data: ClientLoginData): Promise<{ error: string | null }> => {
    try {
      console.log('[ClientAuthContext] Login via Supabase Auth');

      if (!data.email?.trim() || !data.password) {
        return { error: 'Email e senha são obrigatórios' };
      }

      // Login via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (authError) {
        console.error('[ClientAuthContext] Erro no login:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          return { error: 'Email ou senha incorretos' };
        }
        if (authError.message.includes('Email not confirmed')) {
          return { error: '📧 Você precisa confirmar seu e-mail antes de fazer login!' };
        }
        return { error: 'Erro ao fazer login. Tente novamente.' };
      }

      if (!authData.user) {
        return { error: 'Erro ao estabelecer sessão' };
      }

      // Buscar dados do cliente
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('email', authData.user.email)
        .maybeSingle();

      if (clientData) {
        setClient(clientData);
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error) {
      console.error('[ClientAuthContext] Erro inesperado no login:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  };

  // Alias for backward compatibility
  const logout = signOut;

  const updateClient = async (data: Partial<Client>): Promise<{ error: string | null }> => {
    if (!client) return { error: 'Cliente não autenticado' };

    try {
      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', client.id)
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
    loading,
    signUp,
    signIn,
    signOut,
    logout, // Added for backward compatibility
    updateClient
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

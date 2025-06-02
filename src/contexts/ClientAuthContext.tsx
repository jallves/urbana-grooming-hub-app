import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientLoginData, ClientFormData } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

interface ClientAuthContextType {
  client: Client | null;
  loading: boolean;
  signUp: (data: ClientFormData) => Promise<{ error: string | null }>;
  signIn: (data: ClientLoginData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    checkSession();
    
    // Configura listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchClientProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setClient(null);
          localStorage.removeItem('client_token');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchClientProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw error || new Error('Client profile not found');
      }

      setClient(data);
      localStorage.setItem('client_token', data.id);
    } catch (error) {
      console.error('Error fetching client profile:', error);
      setClient(null);
      localStorage.removeItem('client_token');
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('client_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', token)
        .single();

      if (error || !data) {
        throw error || new Error('Session expired');
      }

      setClient(data);
    } catch (error) {
      console.error('Session check error:', error);
      setClient(null);
      localStorage.removeItem('client_token');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: ClientFormData): Promise<{ error: string | null }> => {
    try {
      // Validação melhorada
      if (!data.name?.trim()) return { error: 'Nome é obrigatório' };
      if (!data.email?.trim()) return { error: 'Email é obrigatório' };
      if (!data.phone?.trim()) return { error: 'Telefone é obrigatório' };
      if (!data.password || data.password.length < 6) {
        return { error: 'Senha deve ter pelo menos 6 caracteres' };
      }
      if (data.password !== data.confirmPassword) {
        return { error: 'As senhas não coincidem' };
      }

      // Verificação de email existente
      const { data: existingClient, error: emailError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', data.email.trim().toLowerCase())
        .maybeSingle();

      if (emailError) throw emailError;
      if (existingClient) return { error: 'Este email já está cadastrado' };

      // Criação de usuário com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            role: 'client'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) return { error: 'Erro ao criar usuário' };

      // Criação do perfil do cliente
      const clientData = {
        id: authData.user.id,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        birth_date: data.birth_date || null,
        whatsapp: data.whatsapp?.trim() || null
      };

      const { error: insertError } = await supabase
        .from('clients')
        .insert(clientData);

      if (insertError) throw insertError;

      // Login automático após cadastro
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) throw signInError;

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo à nossa barbearia.",
      });

      return { error: null };

    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error.message || 'Erro ao criar conta' };
    }
  };

  const signIn = async (data: ClientLoginData): Promise<{ error: string | null }> => {
    try {
      if (!data.email?.trim() || !data.password) {
        return { error: 'Email e senha são obrigatórios' };
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) throw authError;
      if (!authData.user) return { error: 'Usuário não encontrado' };

      // Busca perfil do cliente
      await fetchClientProfile(authData.user.id);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || 'Credenciais inválidas' };
    }
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    } else {
      setClient(null);
      localStorage.removeItem('client_token');
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    }
  };

  const updateClient = async (data: Partial<Client>): Promise<{ error: string | null }> => {
    if (!client) return { error: 'Cliente não autenticado' };

    try {
      const updates = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', client.id);

      if (error) throw error;

      // Atualiza estado local
      setClient(prev => ({ ...prev, ...updates } as Client));

      // Se email foi alterado, atualiza no Auth
      if (data.email) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: data.email
        });
        if (updateError) throw updateError;
      }

      toast({
        title: "Perfil atualizado!",
        description: "Seus dados foram salvos com sucesso.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Update error:', error);
      return { error: error.message || 'Erro ao atualizar perfil' };
    }
  };

  const value = {
    client,
    loading,
    signUp,
    signIn,
    signOut,
    updateClient
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {!loading && children}
    </ClientAuthContext.Provider>
  );
}

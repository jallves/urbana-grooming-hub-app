
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

  // Verificar sessão existente ao carregar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('client_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verificar se o cliente ainda existe no banco
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', token)
        .single();

      if (error) {
        // Se houver erro, mas não for "not found", manter o token
        if (error.code !== 'PGRST116') {
          console.error('Erro ao verificar sessão:', error);
        } else {
          // Só remove o token se o cliente realmente não existir
          localStorage.removeItem('client_token');
        }
        setClient(null);
      } else if (data) {
        setClient(data);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      // Não remover o token em caso de erro de conexão
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: ClientFormData): Promise<{ error: string | null }> => {
    try {
      // Validar idade mínima
      if (data.birth_date) {
        const birthDate = new Date(data.birth_date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 14) {
          return { error: 'Idade mínima é de 14 anos' };
        }
      }

      // Verificar se senhas coincidem
      if (data.password !== data.confirmPassword) {
        return { error: 'As senhas não coincidem' };
      }

      // Verificar se email já existe
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingClient) {
        return { error: 'Email já está em uso' };
      }

      // Hash da senha (simulado - em produção usar bcrypt no backend)
      const passwordHash = btoa(data.password); // Base64 para simulação

      // Criar cliente
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          birth_date: data.birth_date || null,
          password_hash: passwordHash,
          email_verified: false
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Armazenar token
      localStorage.setItem('client_token', newClient.id);
      setClient(newClient);

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo à nossa barbearia.",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signIn = async (data: ClientLoginData): Promise<{ error: string | null }> => {
    try {
      // Hash da senha para comparação
      const passwordHash = btoa(data.password);

      // Buscar cliente
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', data.email)
        .eq('password_hash', passwordHash)
        .single();

      if (error || !clientData) {
        return { error: 'Email ou senha incorretos' };
      }

      // Armazenar token
      localStorage.setItem('client_token', clientData.id);
      setClient(clientData);

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
    localStorage.removeItem('client_token');
    setClient(null);
    
    toast({
      title: "Logout realizado",
      description: "Até a próxima!",
    });
  };

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
    updateClient
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

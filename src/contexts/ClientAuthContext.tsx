
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
  }, []);

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
        .maybeSingle();

      if (error || !data) {
        localStorage.removeItem('client_token');
        setClient(null);
      } else {
        setClient(data);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      localStorage.removeItem('client_token');
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: ClientFormData): Promise<{ error: string | null }> => {
    try {
      // Validações básicas
      if (!data.name?.trim()) {
        return { error: 'Nome é obrigatório' };
      }

      if (!data.email?.trim()) {
        return { error: 'Email é obrigatório' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        return { error: 'Email inválido' };
      }

      if (!data.phone?.trim()) {
        return { error: 'Telefone é obrigatório' };
      }

      if (!data.password || data.password.length < 6) {
        return { error: 'Senha deve ter pelo menos 6 caracteres' };
      }

      if (data.password !== data.confirmPassword) {
        return { error: 'As senhas não coincidem' };
      }

      // Verificar se email já existe
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', data.email.trim().toLowerCase())
        .maybeSingle();

      if (existingClient) {
        return { error: 'Este email já está cadastrado' };
      }

      // Validar data de nascimento se fornecida
      if (data.birth_date) {
        const birthDate = new Date(data.birth_date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 14) {
          return { error: 'Idade mínima é de 14 anos' };
        }
      }

      // Criar cliente
      const clientData = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        birth_date: data.birth_date || null,
        password_hash: btoa(data.password), // Hash simples para demo
        email_verified: false,
        whatsapp: data.whatsapp?.trim() || null
      };

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        if (error.code === '23505') {
          return { error: 'Este email já está cadastrado' };
        }
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      if (!newClient) {
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      // Fazer login automático após cadastro
      localStorage.setItem('client_token', newClient.id);
      setClient(newClient);

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo à nossa barbearia.",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  };

  const signIn = async (data: ClientLoginData): Promise<{ error: string | null }> => {
    try {
      if (!data.email?.trim() || !data.password) {
        return { error: 'Email e senha são obrigatórios' };
      }

      const passwordHash = btoa(data.password);

      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', data.email.trim().toLowerCase())
        .eq('password_hash', passwordHash)
        .maybeSingle();

      if (error) {
        console.error('Erro na consulta:', error);
        return { error: 'Erro interno do servidor' };
      }

      if (!clientData) {
        return { error: 'Email ou senha incorretos' };
      }

      localStorage.setItem('client_token', clientData.id);
      setClient(clientData);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
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

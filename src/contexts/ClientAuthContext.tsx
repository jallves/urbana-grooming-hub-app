
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientLoginData, ClientFormData } from '@/types/client';
import { useToast } from '@/hooks/use-toast';
import { sessionManager } from '@/hooks/useSessionManager';

interface ClientAuthContextType {
  client: Client | null;
  loading: boolean;
  signUp: (data: ClientFormData) => Promise<{ error: string | null }>;
  signIn: (data: ClientLoginData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Added for backward compatibility
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
      console.log('Iniciando cadastro com dados:', { ...data, password: '[HIDDEN]' });

      // Validar se todos os campos obrigatórios estão preenchidos
      if (!data.name?.trim()) {
        return { error: 'Nome é obrigatório' };
      }

      if (!data.email?.trim()) {
        return { error: 'Email é obrigatório' };
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
      console.log('Verificando se email já existe:', data.email);
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', data.email.trim().toLowerCase())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar email existente:', checkError);
        return { error: 'Erro interno. Tente novamente.' };
      }

      if (existingClient) {
        console.log('Email já existe no banco');
        return { error: 'Este email já está cadastrado' };
      }

      // Criar hash simples da senha
      const passwordHash = btoa(data.password);

      // Preparar dados do cliente
      const clientData = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        birth_date: data.birth_date || null,
        password_hash: passwordHash,
        email_verified: false,
        whatsapp: data.whatsapp?.trim() || null
      };

      console.log('Inserindo cliente no banco:', { ...clientData, password_hash: '[HIDDEN]' });

      // Inserir cliente no banco usando conexão anônima
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir cliente:', insertError);
        
        if (insertError.code === '23505') {
          return { error: 'Este email já está cadastrado' };
        }
        
        return { error: `Erro ao criar conta: ${insertError.message}` };
      }

      if (!newClient) {
        console.error('Cliente não retornado após inserção');
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      console.log('Cliente criado com sucesso:', newClient.id);

      // Fazer login automático
      localStorage.setItem('client_token', newClient.id);
      setClient(newClient);

      // Criar sessão (não bloqueante - não interrompe o cadastro se falhar)
      sessionManager.createSession({
        userId: newClient.id,
        userType: 'client',
        userEmail: newClient.email || undefined,
        userName: newClient.name,
        expiresInHours: 24,
      }).catch(err => console.warn('[Client] ⚠️ Erro ao criar sessão (não crítico):', err));

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo à nossa barbearia.",
      });

      return { error: null };

    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  };

  const signIn = async (data: ClientLoginData): Promise<{ error: string | null }> => {
    try {
      console.log('Tentando fazer login com email:', data.email);

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

      if (error && error.code !== 'PGRST116') {
        console.error('Erro na consulta de login:', error);
        return { error: 'Erro interno do servidor' };
      }

      if (!clientData) {
        console.log('Cliente não encontrado ou senha incorreta');
        return { error: 'Email ou senha incorretos' };
      }

      console.log('Login realizado com sucesso para:', clientData.email);

      localStorage.setItem('client_token', clientData.id);
      setClient(clientData);

      // Criar sessão (não bloqueante - não interrompe o login se falhar)
      sessionManager.createSession({
        userId: clientData.id,
        userType: 'client',
        userEmail: clientData.email || undefined,
        userName: clientData.name,
        expiresInHours: 24,
      }).catch(err => console.warn('[Client] ⚠️ Erro ao criar sessão (não crítico):', err));

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  };

  const signOut = async (): Promise<void> => {
    // Invalidar sessão (não bloqueante - não interrompe o logout se falhar)
    sessionManager.invalidateSession('client').catch(err => 
      console.warn('[Client] ⚠️ Erro ao invalidar sessão (não crítico):', err)
    );
    
    localStorage.removeItem('client_token');
    setClient(null);
    
    toast({
      title: "Logout realizado",
      description: "Até a próxima!",
    });

    // Redirect to homepage after logout
    window.location.href = '/';
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

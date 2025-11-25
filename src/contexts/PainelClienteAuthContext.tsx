
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  data_nascimento?: string;
  created_at: string;
}

interface PainelClienteAuthContextType {
  cliente: Cliente | null;
  loading: boolean;
  cadastrar: (dados: CadastroData) => Promise<{ error: string | null }>;
  login: (email: string, senha: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  atualizarPerfil: (dados: Partial<Cliente>) => Promise<{ error: string | null }>;
}

interface CadastroData {
  nome: string;
  email: string;
  whatsapp: string;
  data_nascimento: string;
  senha: string;
}

const PainelClienteAuthContext = createContext<PainelClienteAuthContextType | undefined>(undefined);

export function usePainelClienteAuth() {
  const context = useContext(PainelClienteAuthContext);
  if (context === undefined) {
    throw new Error('usePainelClienteAuth deve ser usado dentro de PainelClienteAuthProvider');
  }
  return context;
}

interface PainelClienteAuthProviderProps {
  children: ReactNode;
}

export function PainelClienteAuthProvider({ children }: PainelClienteAuthProviderProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para buscar perfil do cliente
  const buscarPerfilCliente = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      if (!profile) return null;

      // Buscar email do auth.users
      const { data: { user: authUser } } = await supabase.auth.getUser();

      return {
        id: profile.id,
        nome: profile.nome,
        email: authUser?.email || '',
        whatsapp: profile.whatsapp,
        data_nascimento: profile.data_nascimento,
        created_at: profile.created_at
      } as Cliente;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }, []);

  // Listener de mudanças de autenticação
  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Buscar perfil do cliente
          const perfil = await buscarPerfilCliente(session.user.id);
          setCliente(perfil);
        } else {
          setCliente(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const perfil = await buscarPerfilCliente(session.user.id);
        setCliente(perfil);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [buscarPerfilCliente]);

  const cadastrar = useCallback(async (dados: CadastroData): Promise<{ error: string | null }> => {
    try {
      // Validações
      if (!dados.nome?.trim()) {
        return { error: 'Nome é obrigatório' };
      }

      if (!dados.email?.trim()) {
        return { error: 'E-mail é obrigatório' };
      }

      if (!dados.whatsapp?.trim()) {
        return { error: 'WhatsApp é obrigatório' };
      }

      if (!dados.data_nascimento?.trim()) {
        return { error: 'Data de nascimento é obrigatória' };
      }

      if (!dados.senha || dados.senha.length < 8) {
        return { error: 'Senha deve ter pelo menos 8 caracteres' };
      }

      // Validar formato da senha
      const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!senhaRegex.test(dados.senha)) {
        return { error: 'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial' };
      }

      // Criar usuário no auth.users
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: dados.email.trim().toLowerCase(),
        password: dados.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/painel-cliente/dashboard`,
          data: {
            user_type: 'client',
            nome: dados.nome.trim(),
            whatsapp: dados.whatsapp.trim(),
            data_nascimento: dados.data_nascimento
          }
        }
      });

      if (signUpError) {
        console.error('Erro ao criar usuário:', signUpError);
        
        if (signUpError.message.includes('already registered')) {
          return { error: 'Este e-mail já está cadastrado' };
        }
        
        return { error: `Erro ao criar conta: ${signUpError.message}` };
      }

      if (!authData.user) {
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao painel do cliente.",
      });

      // O perfil será criado automaticamente pelo trigger
      // A sessão será gerenciada pelo onAuthStateChange

      return { error: null };

    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  }, [toast]);

  const login = useCallback(async (email: string, senha: string): Promise<{ error: string | null }> => {
    try {
      if (!email?.trim() || !senha) {
        return { error: 'E-mail e senha são obrigatórios' };
      }

      // Fazer login usando supabase.auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha
      });

      if (error) {
        console.error('Erro no login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'E-mail ou senha incorretos' };
        }
        
        return { error: 'Erro ao fazer login. Tente novamente.' };
      }

      if (!data.user) {
        return { error: 'Erro ao fazer login. Tente novamente.' };
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      // O perfil será carregado automaticamente pelo onAuthStateChange

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setCliente(null);
    setUser(null);
    setSession(null);
    
    toast({
      title: "Logout realizado",
      description: "Até a próxima!",
    });
  }, [toast]);

  const atualizarPerfil = useCallback(async (dados: Partial<Cliente>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({
          nome: dados.nome,
          whatsapp: dados.whatsapp,
          data_nascimento: dados.data_nascimento,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      // Atualizar email se necessário
      if (dados.email && dados.email !== user.email) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: dados.email
        });

        if (updateError) {
          return { error: updateError.message };
        }
      }

      // Recarregar perfil
      const perfil = await buscarPerfilCliente(user.id);
      if (perfil) {
        setCliente(perfil);
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { error: 'Erro interno do servidor' };
    }
  }, [user, buscarPerfilCliente]);

  const value = {
    cliente,
    loading,
    cadastrar,
    login,
    logout,
    atualizarPerfil
  };

  return (
    <PainelClienteAuthContext.Provider value={value}>
      {children}
    </PainelClienteAuthContext.Provider>
  );
}

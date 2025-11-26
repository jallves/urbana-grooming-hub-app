import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@supabase/supabase-js';
import { sessionManager } from '@/hooks/useSessionManager';

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
  session: Session | null;
  authLoading: boolean;
  cadastrar: (dados: CadastroData) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  // Função para buscar perfil do cliente
  const buscarPerfilCliente = useCallback(async (userId: string): Promise<Cliente | null> => {
    try {
      console.log('[Auth] 🔍 Buscando perfil do cliente...');
      
      const { data: profile, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] ❌ Erro ao buscar perfil:', error);
        return null;
      }

      if (!profile) {
        console.error('[Auth] ❌ Perfil não encontrado');
        return null;
      }

      // Buscar email do auth.users
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const clienteData: Cliente = {
        id: profile.id,
        nome: profile.nome,
        email: authUser?.email || '',
        whatsapp: profile.whatsapp,
        data_nascimento: profile.data_nascimento,
        created_at: profile.created_at
      };

      console.log('[Auth] ✅ Perfil carregado:', clienteData.nome);
      return clienteData;
    } catch (error) {
      console.error('[Auth] ❌ Erro crítico ao buscar perfil:', error);
      return null;
    }
  }, []);

  // Inicialização: Verificar sessão existente
  useEffect(() => {
    console.log('[Auth] 🚀 Inicializando autenticação...');
    
    let mounted = true;

    // Função interna para buscar perfil (evita dependência externa)
    const fetchProfile = async (userId: string): Promise<Cliente | null> => {
      try {
        console.log('[Auth] 🔍 Buscando perfil do cliente...');
        
        const { data: profile, error } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error || !profile) {
          console.error('[Auth] ❌ Erro ao buscar perfil:', error);
          return null;
        }

        const { data: { user: authUser } } = await supabase.auth.getUser();

        const clienteData: Cliente = {
          id: profile.id,
          nome: profile.nome,
          email: authUser?.email || '',
          whatsapp: profile.whatsapp,
          data_nascimento: profile.data_nascimento,
          created_at: profile.created_at
        };

        console.log('[Auth] ✅ Perfil carregado:', clienteData.nome);
        return clienteData;
      } catch (error) {
        console.error('[Auth] ❌ Erro crítico ao buscar perfil:', error);
        return null;
      }
    };

    // 1. Configurar listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log('[Auth] 🔄 Evento:', event, '| Sessão:', currentSession ? '✅' : '❌');

        setSession(currentSession);

        if (currentSession?.user) {
          console.log('[Auth] ✅ Carregando perfil do usuário...');
          const perfil = await fetchProfile(currentSession.user.id);
          if (mounted) {
            setCliente(perfil);
            setAuthLoading(false);
          }
        } else {
          console.log('[Auth] ❌ Sem usuário autenticado');
          if (mounted) {
            setCliente(null);
            setAuthLoading(false);
          }
        }
      }
    );

    // 2. DEPOIS verificar sessão existente
    const initSession = async () => {
      try {
        console.log('[Auth] 📋 Verificando sessão existente...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] ❌ Erro ao buscar sessão:', error);
          if (mounted) {
            setSession(null);
            setCliente(null);
            setAuthLoading(false);
          }
          return;
        }

        if (!mounted) return;

        console.log('[Auth] 📋 Sessão:', session ? '✅ ENCONTRADA' : '❌ NÃO ENCONTRADA');

        if (session?.user) {
          console.log('[Auth] 🔍 Buscando perfil inicial...');
          setSession(session);
          const perfil = await fetchProfile(session.user.id);
          if (mounted) {
            setCliente(perfil);
            setAuthLoading(false);
          }
        } else {
          if (mounted) {
            setSession(null);
            setCliente(null);
            setAuthLoading(false);
          }
        }
      } catch (error) {
        console.error('[Auth] ❌ Erro crítico na inicialização:', error);
        if (mounted) {
          setSession(null);
          setCliente(null);
          setAuthLoading(false);
        }
      }
    };

    // Iniciar verificação
    initSession();

    return () => {
      console.log('[Auth] 🧹 Limpando subscriptions...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Sem dependências - executa apenas uma vez

  const cadastrar = useCallback(async (dados: CadastroData): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    try {
      // Validações de formato
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

      console.log('[Auth] 🚀 Enviando dados para edge function...');

      const { data: result, error: functionError } = await supabase.functions.invoke('register-client', {
        body: {
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          whatsapp: dados.whatsapp.trim(),
          data_nascimento: dados.data_nascimento,
          senha: dados.senha
        }
      });

      if (functionError) {
        console.error('[Auth] ❌ Erro ao chamar edge function:', functionError);
        return { 
          error: 'Não foi possível processar seu cadastro neste momento. Por favor, verifique sua conexão e tente novamente.' 
        };
      }

      if (!result || !result.success) {
        const errorMessage = result?.error || 'Erro ao processar cadastro. Tente novamente.';
        console.error('[Auth] ❌ Edge function retornou erro:', errorMessage);
        return { error: errorMessage };
      }

      console.log('[Auth] ✅ Cadastro realizado com sucesso');
      
      toast({
        title: "✅ Cadastro realizado com sucesso!",
        description: "📧 Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada e também a pasta de spam para ativar sua conta.",
        duration: 12000,
      });

      return { 
        error: null, 
        needsEmailConfirmation: result.needsEmailConfirmation || true 
      };

    } catch (error) {
      console.error('[Auth] ❌ Erro inesperado no cadastro:', error);
      return { 
        error: 'Erro inesperado ao criar conta. Por favor, tente novamente ou entre em contato conosco.' 
      };
    }
  }, [toast]);

  const login = useCallback(async (email: string, senha: string): Promise<{ error: string | null }> => {
    try {
      if (!email?.trim() || !senha) {
        return { error: 'E-mail e senha são obrigatórios' };
      }

      console.log('[Auth] 🔐 Tentando fazer login...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha
      });

      if (error) {
        console.error('[Auth] ❌ Erro no login:', error);
        
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid_credentials') ||
            error.status === 400) {
          return { error: 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.' };
        }
        
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email_not_confirmed') ||
            error.message.includes('not confirmed')) {
          return { 
            error: '📧 Você precisa confirmar seu e-mail antes de fazer login!\n\n📬 Verifique sua caixa de entrada e também a pasta de SPAM/Promoções.\n\n❓ Não recebeu o e-mail? Entre em contato conosco.'
          };
        }
        
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          return { error: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' };
        }
        
        if (error.message.includes('network') || error.message.includes('connection')) {
          return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
        }
        
        return { error: 'Erro ao fazer login. Tente novamente ou entre em contato conosco.' };
      }

      if (!data.user) {
        return { error: 'Erro ao fazer login. Tente novamente.' };
      }

      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        return { 
          error: '📧 Você precisa confirmar seu e-mail antes de fazer login!\n\n📬 Verifique sua caixa de entrada e também a pasta de SPAM/Promoções.\n\n❓ Não recebeu o e-mail? Entre em contato conosco.'
        };
      }

      console.log('[Auth] ✅ Login realizado com sucesso');

      // Criar sessão
      await sessionManager.createSession({
        userId: data.user.id,
        userType: 'painel_cliente',
        userEmail: data.user.email,
        userName: data.user.email,
        expiresInHours: 24,
      });

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      // O perfil será carregado automaticamente pelo onAuthStateChange

      return { error: null };
    } catch (error) {
      console.error('[Auth] ❌ Erro inesperado no login:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('[Auth] 🚪 Fazendo logout...');
      
      // Invalidar sessão
      await sessionManager.invalidateSession('painel_cliente');
      
      await supabase.auth.signOut();
      
      setCliente(null);
      setSession(null);
      
      console.log('[Auth] ✅ Logout concluído');
      
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    } catch (error) {
      console.error('[Auth] ❌ Erro ao fazer logout:', error);
      
      setCliente(null);
      setSession(null);
      
      toast({
        title: "Sessão encerrada",
        description: "Você será redirecionado ao login",
        variant: "destructive"
      });
    }
  }, [toast]);

  const atualizarPerfil = useCallback(async (dados: Partial<Cliente>): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({
          nome: dados.nome,
          whatsapp: dados.whatsapp,
          data_nascimento: dados.data_nascimento,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) {
        return { error: error.message };
      }

      // Atualizar email se necessário
      if (dados.email && dados.email !== session.user.email) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: dados.email
        });

        if (updateError) {
          return { error: updateError.message };
        }
      }

      // Recarregar perfil
      const perfil = await buscarPerfilCliente(session.user.id);
      if (perfil) {
        setCliente(perfil);
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] ❌ Erro ao atualizar perfil:', error);
      return { error: 'Erro interno do servidor' };
    }
  }, [session, buscarPerfilCliente]);

  const value = {
    cliente,
    session,
    authLoading,
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

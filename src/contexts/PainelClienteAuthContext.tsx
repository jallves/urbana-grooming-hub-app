
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
    let mounted = true;

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[PainelClienteAuth] Auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Buscar perfil do cliente com timeout
          const timeoutId = setTimeout(() => {
            console.warn('[PainelClienteAuth] ⏱️ Timeout ao buscar perfil');
            if (mounted) {
              setLoading(false);
            }
          }, 8000);

          try {
            const perfil = await buscarPerfilCliente(session.user.id);
            clearTimeout(timeoutId);
            
            if (mounted) {
              setCliente(perfil);
              setLoading(false);
            }
          } catch (error) {
            clearTimeout(timeoutId);
            console.error('[PainelClienteAuth] Erro ao buscar perfil:', error);
            if (mounted) {
              setCliente(null);
              setLoading(false);
            }
          }
        } else {
          if (mounted) {
            setCliente(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session com timeout
    const initSession = async () => {
      const initTimeoutId = setTimeout(() => {
        console.warn('[PainelClienteAuth] ⏱️ Timeout ao inicializar sessão');
        if (mounted) {
          setLoading(false);
        }
      }, 10000);

      try {
        console.log('[PainelClienteAuth] Verificando sessão...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(initTimeoutId);

        if (error) {
          console.error('[PainelClienteAuth] Erro ao buscar sessão:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[PainelClienteAuth] Sessão encontrada');
          const perfil = await buscarPerfilCliente(session.user.id);
          if (mounted) {
            setCliente(perfil);
            console.log('[PainelClienteAuth] ✅ Perfil:', perfil?.nome);
          }
        } else {
          console.log('[PainelClienteAuth] Sem sessão ativa');
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        clearTimeout(initTimeoutId);
        console.error('[PainelClienteAuth] Erro crítico:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remover buscarPerfilCliente das dependências

  const cadastrar = useCallback(async (dados: CadastroData): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    try {
      // ===================================================================
      // ETAPA 1: VALIDAÇÕES DE FORMATO
      // ===================================================================
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

      // ===================================================================
      // ETAPA 2: CHAMAR EDGE FUNCTION QUE CONTROLA TODO O FLUXO
      // ===================================================================
      console.log('🚀 Enviando dados para edge function...');

      const { data: result, error: functionError } = await supabase.functions.invoke('register-client', {
        body: {
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          whatsapp: dados.whatsapp.trim(),
          data_nascimento: dados.data_nascimento,
          senha: dados.senha
        }
      });

      // ⚠️ Erro na chamada da função (problema de rede ou função indisponível)
      if (functionError) {
        console.error('❌ Erro ao chamar edge function:', functionError);
        return { 
          error: '⚠️ Não foi possível processar seu cadastro neste momento.\n\nPor favor, verifique sua conexão e tente novamente.' 
        };
      }

      // ⚠️ Verificar se a função retornou erro de validação
      if (!result || !result.success) {
        const errorMessage = result?.error || 'Erro ao processar cadastro. Tente novamente.';
        console.error('❌ Edge function retornou erro:', errorMessage);
        return { error: errorMessage };
      }

      // ===================================================================
      // ✅ SUCESSO!
      // ===================================================================
      console.log('✅ Cadastro realizado com sucesso via edge function');
      
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
      console.error('❌ Erro inesperado no cadastro:', error);
      return { 
        error: '❌ Erro inesperado ao criar conta.\n\nPor favor, tente novamente ou entre em contato conosco.' 
      };
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
        
        // Tratamento específico de erros de login
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid_credentials') ||
            error.status === 400) {
          return { error: '⚠️ E-mail ou senha incorretos. Verifique seus dados e tente novamente.' };
        }
        
        // IMPORTANTE: Verificar se o e-mail não foi confirmado
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email_not_confirmed') ||
            error.message.includes('not confirmed')) {
          return { 
            error: '📧 Você precisa confirmar seu e-mail antes de fazer login!\n\n' +
                   '📬 Verifique sua caixa de entrada e também a pasta de SPAM/Promoções.\n\n' +
                   '❓ Não recebeu o e-mail? Entre em contato conosco.'
          };
        }
        
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          return { error: '⚠️ Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' };
        }
        
        if (error.message.includes('network') || error.message.includes('connection')) {
          return { error: '⚠️ Erro de conexão. Verifique sua internet e tente novamente.' };
        }
        
        return { error: '❌ Erro ao fazer login. Tente novamente ou entre em contato conosco.' };
      }

      if (!data.user) {
        return { error: 'Erro ao fazer login. Tente novamente.' };
      }

      // IMPORTANTE: Verificar se o e-mail foi confirmado
      if (!data.user.email_confirmed_at) {
        // Fazer logout imediato
        await supabase.auth.signOut();
        return { 
          error: '📧 Você precisa confirmar seu e-mail antes de fazer login!\n\n' +
                 '📬 Verifique sua caixa de entrada e também a pasta de SPAM/Promoções.\n\n' +
                 '❓ Não recebeu o e-mail? Entre em contato conosco.'
        };
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
    try {
      console.log('[PainelClienteAuth] 🚪 Iniciando logout...');
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[PainelClienteAuth] ❌ Erro ao fazer logout:', error);
        throw error;
      }
      
      console.log('[PainelClienteAuth] ✅ Logout do Supabase concluído');
      
      // Limpar estados locais
      setCliente(null);
      setUser(null);
      setSession(null);
      
      // Limpar localStorage completamente
      try {
        localStorage.removeItem('supabase.auth.token');
        console.log('[PainelClienteAuth] 🧹 LocalStorage limpo');
      } catch (e) {
        console.warn('[PainelClienteAuth] ⚠️ Erro ao limpar localStorage:', e);
      }
      
      toast({
        title: "✅ Logout realizado",
        description: "Até a próxima!",
      });
      
      console.log('[PainelClienteAuth] ✅ Logout completo');
    } catch (error) {
      console.error('[PainelClienteAuth] ❌ Erro crítico no logout:', error);
      
      // Mesmo com erro, limpar estados locais
      setCliente(null);
      setUser(null);
      setSession(null);
      
      toast({
        title: "⚠️ Sessão encerrada",
        description: "Você será redirecionado ao login",
        variant: "destructive"
      });
    }
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

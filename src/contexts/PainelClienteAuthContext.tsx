
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

        console.log('[PainelClienteAuth] Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Buscar perfil do cliente
          const perfil = await buscarPerfilCliente(session.user.id);
          if (mounted) {
            setCliente(perfil);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setCliente(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session IMEDIATAMENTE
    const initSession = async () => {
      try {
        console.log('[PainelClienteAuth] Verificando sessão existente...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
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
          console.log('[PainelClienteAuth] Sessão encontrada, buscando perfil...');
          const perfil = await buscarPerfilCliente(session.user.id);
          if (mounted) {
            setCliente(perfil);
            console.log('[PainelClienteAuth] ✅ Perfil carregado:', perfil?.nome);
          }
        } else {
          console.log('[PainelClienteAuth] Nenhuma sessão ativa');
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('[PainelClienteAuth] Erro ao inicializar sessão:', error);
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
  }, [buscarPerfilCliente]);

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
      // ETAPA 2: VALIDAÇÃO DE WHATSAPP DUPLICADO (ANTES DO SIGNUP)
      // ===================================================================
      console.log('🔍 [1/3] Verificando WhatsApp único:', dados.whatsapp);
      
      const { data: existingWhatsApp, error: whatsappCheckError } = await supabase
        .from('client_profiles')
        .select('nome, whatsapp')
        .eq('whatsapp', dados.whatsapp.trim())
        .maybeSingle();

      // Tratar erros de consulta (exceto "não encontrado")
      if (whatsappCheckError && whatsappCheckError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar WhatsApp:', whatsappCheckError);
        return { 
          error: '⚠️ Não foi possível verificar seus dados neste momento.\n\nPor favor, aguarde alguns segundos e tente novamente.' 
        };
      }

      // Se WhatsApp já existe, bloquear cadastro
      if (existingWhatsApp) {
        console.warn('⚠️ WhatsApp já cadastrado:', existingWhatsApp.whatsapp);
        return { 
          error: `📱 Este número de WhatsApp (${dados.whatsapp}) já está cadastrado em nosso sistema!\n\n` +
                 `Nome cadastrado: ${existingWhatsApp.nome}\n\n` +
                 `✅ Se esta é sua conta, clique em "Já tenho conta" para fazer login.\n` +
                 `🔐 Caso tenha esquecido sua senha, você pode recuperá-la na tela de login.`
        };
      }

      console.log('✅ WhatsApp disponível para cadastro');

      // ===================================================================
      // ETAPA 3: CRIAR USUÁRIO NO AUTH.USERS (VALIDA EMAIL DUPLICADO)
      // ===================================================================
      console.log('🔍 [2/3] Criando usuário no sistema de autenticação...');
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: dados.email.trim().toLowerCase(),
        password: dados.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/painel-cliente/email-confirmado`,
          data: {
            user_type: 'client',
            nome: dados.nome.trim(),
            whatsapp: dados.whatsapp.trim(),
            data_nascimento: dados.data_nascimento
          }
        }
      });

      // ⚠️ SE DEU ERRO NO SIGNUP, PARAR AQUI (EMAIL NÃO FOI ENVIADO)
      if (signUpError) {
        console.error('❌ Erro ao criar usuário:', signUpError);
        
        // Tratamento específico e didático de erros
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('User already registered') ||
            signUpError.message.includes('email_exists') ||
            signUpError.status === 422) {
          return { 
            error: `📧 Este e-mail (${dados.email}) já possui cadastro em nosso sistema!\n\n` +
                   `✅ Clique em "Já tenho conta" para fazer login.\n` +
                   `🔐 Caso tenha esquecido sua senha, você pode recuperá-la na tela de login.`
          };
        }
        
        if (signUpError.message.includes('invalid email')) {
          return { error: '⚠️ E-mail inválido. Por favor, verifique o formato do e-mail.' };
        }
        
        if (signUpError.message.includes('password')) {
          return { error: '⚠️ Senha inválida. Verifique os requisitos de senha.' };
        }
        
        if (signUpError.message.includes('rate limit') || signUpError.message.includes('too many')) {
          return { error: '⚠️ Muitas tentativas. Aguarde alguns minutos e tente novamente.' };
        }
        
        return { error: `❌ Erro ao criar conta: ${signUpError.message}.\n\nTente novamente ou entre em contato conosco.` };
      }

      // ⚠️ SE NÃO CRIOU USUÁRIO, PARAR AQUI
      if (!authData?.user) {
        return { error: '❌ Erro ao criar conta. Tente novamente.' };
      }

      console.log('✅ Usuário criado no auth.users com ID:', authData.user.id);

      // ===================================================================
      // ETAPA 4: CRIAR PERFIL DO CLIENTE (VIA FUNÇÃO SECURITY DEFINER)
      // ===================================================================
      console.log('🔍 [3/3] Criando perfil do cliente...');
      
      const { data: profileResult, error: profileRpcError } = await supabase
        .rpc('create_client_profile_after_signup', {
          p_user_id: authData.user.id,
          p_nome: dados.nome.trim(),
          p_whatsapp: dados.whatsapp.trim(),
          p_data_nascimento: dados.data_nascimento
        });

      // ⚠️ SE DEU ERRO NA CHAMADA DA FUNÇÃO, PARAR AQUI
      if (profileRpcError) {
        console.error('❌ Erro ao chamar função de criação de perfil:', profileRpcError);
        
        // ⚠️ IMPORTANTE: Usuário foi criado mas perfil falhou
        // Email de confirmação JÁ foi enviado, mas cadastro está incompleto
        return { 
          error: '❌ Houve um problema ao finalizar seu cadastro.\n\n' +
                 'Sua conta foi criada, mas faltam alguns dados. Entre em contato conosco para concluir seu cadastro.\n\n' +
                 'Referência: ' + authData.user.email
        };
      }

      // Verificar resposta da função
      const result = profileResult as { success: boolean; error?: string; message?: string };
      
      // ⚠️ SE FUNÇÃO RETORNOU ERRO (ex: WhatsApp duplicado em race condition)
      if (!result.success) {
        console.error('❌ Erro ao criar perfil:', result.error);
        
        // ⚠️ IMPORTANTE: Usuário foi criado mas perfil falhou
        // Email de confirmação JÁ foi enviado
        if (result.error?.includes('WhatsApp')) {
          return { 
            error: '❌ Houve um problema ao finalizar seu cadastro.\n\n' +
                   result.error + '\n\n' +
                   'Entre em contato conosco para resolver este problema.\n\n' +
                   'Referência: ' + authData.user.email
          };
        }
        
        return { 
          error: '❌ Não foi possível completar seu cadastro.\n\n' +
                 'Por favor, aguarde alguns instantes e tente novamente.\n\n' +
                 'Se o problema persistir, entre em contato conosco.\n\n' +
                 'Referência: ' + authData.user.email
        };
      }

      console.log('✅ Perfil criado com sucesso!');

      // ===================================================================
      // ETAPA 5: ✅ TUDO VALIDADO - MOSTRAR MENSAGEM DE SUCESSO
      // ===================================================================
      const needsConfirmation = !authData.session;

      if (needsConfirmation) {
        console.log('✅ Cadastro completo - aguardando confirmação de email');
        toast({
          title: "✅ Cadastro realizado com sucesso!",
          description: "📧 Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada e também a pasta de spam para ativar sua conta.",
          duration: 12000,
        });
        return { error: null, needsEmailConfirmation: true };
      }

      // Se não precisa confirmar email, usuário já está logado
      console.log('✅ Cadastro completo - usuário já está autenticado');
      toast({
        title: "✅ Conta criada com sucesso!",
        description: "Bem-vindo ao painel do cliente.",
      });

      return { error: null, needsEmailConfirmation: false };

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
        
        if (error.message.includes('Email not confirmed')) {
          return { error: '📧 Você precisa confirmar seu e-mail antes de fazer login. Verifique sua caixa de entrada.' };
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

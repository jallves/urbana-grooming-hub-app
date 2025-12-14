import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // Depende do AuthContext unificado

  // Carregar perfil quando houver sessão ativa (depende do AuthContext)
  useEffect(() => {
    let mounted = true;

    const carregarPerfil = async () => {
      if (!user) {
        if (mounted) {
          setCliente(null);
          setLoading(false);
        }
        return;
      }

      try {
        console.log('[PainelClienteAuthContext] 🔍 Carregando perfil do cliente:', user.id);
        
        const { data: profile, error } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[PainelClienteAuthContext] ❌ Erro ao buscar perfil:', error);
          if (mounted) {
            setCliente(null);
            setLoading(false);
          }
          return;
        }

        if (!profile) {
          console.warn('[PainelClienteAuthContext] ⚠️ Perfil não encontrado');
          if (mounted) {
            setCliente(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          const clienteData: Cliente = {
            id: profile.id,
            nome: profile.nome,
            email: profile.email || user.email || '',
            whatsapp: profile.whatsapp,
            data_nascimento: profile.data_nascimento,
            created_at: profile.created_at
          };
          
          setCliente(clienteData);
          setLoading(false);
          console.log('[PainelClienteAuthContext] ✅ Perfil carregado:', clienteData.nome);
        }
      } catch (error) {
        console.error('[PainelClienteAuthContext] ❌ Erro crítico:', error);
        if (mounted) {
          setCliente(null);
          setLoading(false);
        }
      }
    };

    carregarPerfil();

    return () => {
      mounted = false;
    };
  }, [user]); // Recarregar quando user mudar

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

      if (!dados.senha || dados.senha.length < 6) {
        return { error: 'Senha deve ter pelo menos 6 caracteres' };
      }

      console.log('[PainelClienteAuthContext] 🚀 Enviando dados para edge function...');

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
        console.error('[PainelClienteAuthContext] ❌ Erro ao chamar edge function:', functionError);
        return { 
          error: 'Não foi possível processar seu cadastro neste momento. Por favor, verifique sua conexão e tente novamente.' 
        };
      }

      if (!result || !result.success) {
        const errorMessage = result?.error || 'Erro ao processar cadastro. Tente novamente.';
        console.error('[PainelClienteAuthContext] ❌ Edge function retornou erro:', errorMessage);
        return { error: errorMessage };
      }

      console.log('[PainelClienteAuthContext] ✅ Cadastro realizado com sucesso');
      
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
      console.error('[PainelClienteAuthContext] ❌ Erro inesperado no cadastro:', error);
      return { 
        error: 'Erro inesperado ao criar conta. Por favor, tente novamente ou entre em contato conosco.' 
      };
    }
  }, [toast]);

  const atualizarPerfil = useCallback(async (dados: Partial<Cliente>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({
          nome: dados.nome,
          email: dados.email, // Salvar email no perfil
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
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCliente({
          id: profile.id,
          nome: profile.nome,
          email: profile.email || user.email || '',
          whatsapp: profile.whatsapp,
          data_nascimento: profile.data_nascimento,
          created_at: profile.created_at
        });
      }

      toast({
        title: "✅ Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
        duration: 3000,
      });

      return { error: null };
    } catch (error) {
      console.error('[PainelClienteAuthContext] ❌ Erro ao atualizar perfil:', error);
      return { error: 'Erro interno do servidor' };
    }
  }, [user, toast]);

  const value = {
    cliente,
    loading,
    cadastrar,
    atualizarPerfil,
  };

  return (
    <PainelClienteAuthContext.Provider value={value}>
      {children}
    </PainelClienteAuthContext.Provider>
  );
}

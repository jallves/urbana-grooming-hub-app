
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const verificarSessao = useCallback(async () => {
    try {
      const token = localStorage.getItem('painel_cliente_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_painel_cliente_by_id', { cliente_id: token });

      if (error || !data) {
        localStorage.removeItem('painel_cliente_token');
        setCliente(null);
      } else {
        setCliente(data as Cliente);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      localStorage.removeItem('painel_cliente_token');
      setCliente(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verificarSessao();
  }, [verificarSessao]);

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

      // Verificar se email já existe
      const { data: clienteExistente, error: checkError } = await supabase
        .rpc('check_painel_cliente_email', { email_to_check: dados.email.trim().toLowerCase() });

      if (checkError) {
        console.error('Erro ao verificar email:', checkError);
        return { error: 'Erro interno. Tente novamente.' };
      }

      if (clienteExistente) {
        return { error: 'Este e-mail já está cadastrado' };
      }

      // Criar hash da senha
      const senhaHash = btoa(dados.senha);

      // Inserir cliente no painel_clientes
      const { data: novoCliente, error: insertError } = await supabase
        .rpc('create_painel_cliente_with_birth_date', {
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          whatsapp: dados.whatsapp.trim(),
          data_nascimento: dados.data_nascimento,
          senha_hash: senhaHash
        });

      if (insertError) {
        console.error('Erro ao inserir cliente:', insertError);
        return { error: `Erro ao criar conta: ${insertError.message}` };
      }

      if (!novoCliente) {
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      // Replicar no módulo cliente do painel admin
      const { error: replicationError } = await supabase
        .from('clients')
        .insert({
          name: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          phone: dados.whatsapp.trim(),
          whatsapp: dados.whatsapp.trim(),
          birth_date: dados.data_nascimento,
          password_hash: senhaHash,
          email_verified: true
        });

      if (replicationError) {
        console.warn('Erro ao replicar no módulo admin:', replicationError);
        // Não falhamos o cadastro se a replicação falhar
      }

      // Login automático
      const clienteData = novoCliente as Cliente;
      localStorage.setItem('painel_cliente_token', clienteData.id);
      setCliente(clienteData);

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao painel do cliente.",
      });

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

      const senhaHash = btoa(senha);

      const { data: clienteData, error } = await supabase
        .rpc('authenticate_painel_cliente', {
          email: email.trim().toLowerCase(),
          senha_hash: senhaHash
        });

      if (error) {
        console.error('Erro na consulta de login:', error);
        return { error: 'E-mail ou senha incorretos' };
      }

      if (!clienteData) {
        return { error: 'E-mail ou senha incorretos' };
      }

      const cliente = clienteData as Cliente;
      localStorage.setItem('painel_cliente_token', cliente.id);
      setCliente(cliente);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    localStorage.removeItem('painel_cliente_token');
    setCliente(null);
    
    toast({
      title: "Logout realizado",
      description: "Até a próxima!",
    });
  }, [toast]);

  const atualizarPerfil = useCallback(async (dados: Partial<Cliente>): Promise<{ error: string | null }> => {
    if (!cliente) return { error: 'Cliente não autenticado' };

    try {
      const { data: clienteAtualizado, error } = await supabase
        .rpc('update_painel_cliente_with_birth_date', {
          cliente_id: cliente.id,
          nome: dados.nome,
          email: dados.email,
          whatsapp: dados.whatsapp,
          data_nascimento: dados.data_nascimento
        });

      if (error) {
        return { error: error.message };
      }

      setCliente(clienteAtualizado as Cliente);
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { error: 'Erro interno do servidor' };
    }
  }, [cliente]);

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

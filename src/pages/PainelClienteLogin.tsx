import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthContainer from '@/components/ui/containers/AuthContainer';
import PainelClienteLoginForm from '@/components/painel-cliente/auth/PainelClienteLoginForm';
import PainelClienteCadastroForm from '@/components/painel-cliente/auth/PainelClienteCadastroForm';

export default function PainelClienteLogin() {
  const navigate = useNavigate();
  const { cadastrar } = usePainelClienteAuth();
  const { user, signOut, isClient, rolesChecked, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // REDIRECIONAR se já estiver logado como cliente
  React.useEffect(() => {
    // Não fazer NADA até as roles serem verificadas
    if (authLoading || !rolesChecked) {
      console.log('[PainelClienteLogin] ⏳ Aguardando verificação de roles...');
      return;
    }

    // Sem usuário, tudo ok - pode mostrar login
    if (!user) {
      console.log('[PainelClienteLogin] ℹ️ Sem usuário - exibindo formulário de login');
      return;
    }

    // Usuário existe E roles foram verificadas
    if (isClient) {
      console.log('[PainelClienteLogin] ✅ Cliente autenticado - redirecionando para dashboard');
      navigate('/painel-cliente/dashboard', { replace: true });
    } else {
      console.log('[PainelClienteLogin] ⚠️ Usuário não é cliente - fazendo logout');
      signOut();
    }
  }, [user, isClient, rolesChecked, authLoading, navigate, signOut]);

  const handleLogin = async (email: string, senha: string) => {
    setErro('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha
      });

      if (error) {
        console.error('[PainelClienteLogin] ❌ Erro no login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          setErro('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
        } else if (error.message.includes('Email not confirmed')) {
          setErro('📧 Você precisa confirmar seu e-mail antes de fazer login! Verifique sua caixa de entrada.');
        } else {
          setErro('Não foi possível fazer login. Tente novamente.');
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setErro('Erro ao estabelecer sessão. Tente novamente.');
        setLoading(false);
        return;
      }

      toast({
        title: "✅ Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
        duration: 3000,
      });

      navigate('/painel-cliente/dashboard');
    } catch (error) {
      console.error('[PainelClienteLogin] ❌ Erro inesperado:', error);
      setErro('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  const handleCadastro = async (data: {
    nome: string;
    email: string;
    whatsapp: string;
    data_nascimento: string;
    senha: string;
  }) => {
    setErro('');
    setLoading(true);

    const { error, needsEmailConfirmation } = await cadastrar(data);

    if (error) {
      setErro(error);
      setLoading(false);
    } else {
      if (needsEmailConfirmation) {
        // Redirecionar para página de confirmação de email
        navigate('/painel-cliente/confirmar-email');
      } else {
        // Login automático se não precisar confirmar
        navigate('/painel-cliente/dashboard');
      }
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <AuthContainer
      title="Costa Urbana"
      subtitle={mostrarCadastro ? 'Crie sua conta' : 'Área do Cliente'}
    >
      <div className="w-full space-y-6">
        {!mostrarCadastro ? (
          <PainelClienteLoginForm
            onSubmit={handleLogin}
            loading={loading}
            erro={erro}
          />
        ) : (
          <PainelClienteCadastroForm
            onSubmit={handleCadastro}
            loading={loading}
            erro={erro}
          />
        )}

        <div className="text-center space-y-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMostrarCadastro(!mostrarCadastro);
              setErro('');
            }}
            className="text-urbana-gold hover:text-yellow-600 font-medium hover:bg-urbana-gold/10 rounded-xl transition-all"
          >
            {mostrarCadastro ? 'Já tem uma conta? Fazer login' : 'Não tem uma conta? Criar conta'}
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
          onClick={handleGoHome}
        >
          <Home className="h-4 w-4 mr-2" />
          Voltar ao site
        </Button>
      </div>
    </AuthContainer>
  );
}

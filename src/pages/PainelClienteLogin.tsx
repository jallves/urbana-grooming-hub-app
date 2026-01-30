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
import { logAdminActivity } from '@/hooks/useActivityLogger';
import { sessionManager } from '@/hooks/useSessionManager';

export default function PainelClienteLogin() {
  const navigate = useNavigate();
  const { cadastrar } = usePainelClienteAuth();
  const { user, signOut, isClient, rolesChecked, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // SEM REDIRECIONAMENTO AUTOMÁTICO - Mostrar tela de acesso se já logado

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

      // INTEGRAÇÃO: Registrar log de login
      await logAdminActivity({
        action: 'login',
        entityType: 'session',
        entityId: data.user.id,
        newData: { 
          email: data.user.email, 
          userType: 'client',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      });
      
      // INTEGRAÇÃO: Criar sessão ativa
      await sessionManager.createSession({
        userId: data.user.id,
        userType: 'painel_cliente',
        userEmail: data.user.email || undefined,
        userName: data.user.user_metadata?.full_name || data.user.email || undefined,
        expiresInHours: 24
      });

      toast({
        title: "✅ Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
        duration: 3000,
      });

      // CRÍTICO: Após login, verificar se há uma rota salva para restaurar
      const savedRoute = localStorage.getItem('client_last_route');
      const targetRoute = savedRoute && savedRoute.startsWith('/painel-cliente/') 
        ? savedRoute 
        : '/painel-cliente/dashboard';
      
      console.log('[PainelClienteLogin] 🎯 Após login, redirecionando para:', targetRoute);
      navigate(targetRoute);
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
        // CRÍTICO: Login automático - verificar se há uma rota salva para restaurar
        const savedRoute = localStorage.getItem('client_last_route');
        const targetRoute = savedRoute && savedRoute.startsWith('/painel-cliente/') 
          ? savedRoute 
          : '/painel-cliente/dashboard';
        
        console.log('[PainelClienteLogin] 🎯 Após cadastro, redirecionando para:', targetRoute);
        navigate(targetRoute);
      }
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoDashboard = () => {
    const savedRoute = localStorage.getItem('client_last_route');
    const targetRoute = savedRoute && savedRoute.startsWith('/painel-cliente/') 
      ? savedRoute 
      : '/painel-cliente/dashboard';
    navigate(targetRoute);
  };

  const handleLogout = async () => {
    setLoading(true);
    localStorage.removeItem('client_last_route');
    await signOut();
    setLoading(false);
  };

  // Se já estiver logado como cliente, mostrar tela de acesso
  if (user && isClient && rolesChecked && !authLoading) {
    return (
      <AuthContainer
        title="Costa Urbana"
        subtitle="Você já está logado"
      >
        <div className="w-full space-y-4">
          <div className="p-6 bg-urbana-gold/10 border border-urbana-gold/20 rounded-xl text-center space-y-2">
            <p className="text-urbana-gold font-semibold text-lg">✅ Sessão Ativa</p>
            <p className="text-urbana-light/80 text-sm">
              Você já está logado como cliente.
            </p>
          </div>

          <Button
            onClick={handleGoDashboard}
            variant="default"
            disabled={loading}
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black h-12 rounded-xl"
          >
            Ir para o Painel
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            disabled={loading}
            className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 h-12 rounded-xl"
          >
            Sair da Conta
          </Button>

          <Button
            onClick={handleGoHome}
            variant="ghost"
            className="w-full text-urbana-light/60 hover:text-urbana-gold hover:bg-urbana-gold/10 h-12 rounded-xl"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao site
          </Button>
        </div>
      </AuthContainer>
    );
  }

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

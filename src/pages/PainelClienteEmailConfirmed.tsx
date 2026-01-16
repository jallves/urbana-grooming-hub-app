import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function PainelClienteEmailConfirmed() {
  const navigate = useNavigate();
  const { cliente, loading } = usePainelClienteAuth();
  const [countdown, setCountdown] = useState(5);
  const [exchanging, setExchanging] = useState(true);

  // 1) Primeiro: se a URL veio do link do Supabase (confirm email), capturar tokens/código e criar sessão
  useEffect(() => {
    let mounted = true;

    const exchangeFromUrl = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        console.log('[PainelClienteEmailConfirmed] 🔗 Params:', {
          hasCode: !!code,
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
        });

        // Fluxo PKCE (code)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // limpar URL (remove ?code=...)
          const cleanUrl = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // Fluxo implicit (hash com tokens)
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          // limpar hash
          const cleanUrl = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (error: any) {
        console.error('[PainelClienteEmailConfirmed] ❌ Falha ao criar sessão a partir do link:', error);
        // não bloqueia a tela; o usuário ainda pode logar manualmente
      } finally {
        if (mounted) setExchanging(false);
      }
    };

    exchangeFromUrl();

    return () => {
      mounted = false;
    };
  }, []);

  // 2) Depois: quando o auth/context parar de carregar (e já tentamos trocar token), redireciona
  useEffect(() => {
    console.log('[PainelClienteEmailConfirmed] 🔍 Estado atual:', { loading, exchanging, hasCliente: !!cliente });

    if (!loading && !exchanging) {
      console.log('[PainelClienteEmailConfirmed] ✅ Pronto para redirecionar');

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            console.log('[PainelClienteEmailConfirmed] ⏰ Redirecionando para dashboard...');
            navigate('/painel-cliente/dashboard', { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, exchanging, cliente, navigate]);

  if (loading || exchanging) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Verificando...">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-urbana-gold animate-spin" />
          <p className="text-urbana-light/70">Confirmando seu e-mail...</p>
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer
      title="Costa Urbana"
      subtitle="E-mail Confirmado!"
    >
      <div className="w-full space-y-6 text-center">
        {/* Ícone de Sucesso */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-urbana-light">
            E-mail Confirmado com Sucesso!
          </h2>
          <p className="text-urbana-light/70 text-base leading-relaxed">
            🎉 Bem-vindo(a) à Costa Urbana! Sua conta foi ativada com sucesso.
          </p>
          <p className="text-urbana-light/60 text-sm">
            Redirecionando para o painel em {countdown} segundos...
          </p>
        </div>

        {/* Botão Manual */}
        <Button
          className="w-full bg-urbana-gold hover:bg-yellow-600 text-urbana-black font-semibold h-12 rounded-xl transition-all"
          onClick={() => navigate('/painel-cliente/dashboard')}
        >
          Ir para o Painel Agora
        </Button>
      </div>
    </AuthContainer>
  );
}

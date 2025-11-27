import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

export default function PainelClienteEmailConfirmed() {
  const navigate = useNavigate();
  const { cliente, loading } = usePainelClienteAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.log('[PainelClienteEmailConfirmed] 🔍 Estado atual:', { loading, hasCliente: !!cliente });
    
    // Aguardar até que o loading termine e o cliente esteja carregado
    if (!loading) {
      console.log('[PainelClienteEmailConfirmed] ✅ Loading concluído');
      
      // Iniciar countdown independente de ter cliente ou não
      // Pois o usuário acabou de confirmar o e-mail e deve estar autenticado
      const timer = setInterval(() => {
        setCountdown(prev => {
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
  }, [loading, navigate]);

  if (loading) {
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

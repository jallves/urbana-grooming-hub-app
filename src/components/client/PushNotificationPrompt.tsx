import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PainelClienteCard, PainelClienteCardHeader, PainelClienteCardTitle, PainelClienteCardDescription, PainelClienteCardContent } from '@/components/painel-cliente/PainelClienteCard';
import { toast } from 'sonner';

export const PushNotificationPrompt: React.FC = () => {
  console.log('🔔🔔🔔 [PROMPT] COMPONENTE EXECUTANDO!');
  
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  console.log('🔔 [PROMPT] Valores recebidos do hook:', { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission 
  });

  useEffect(() => {
    console.log('🔔 [PROMPT] useEffect montagem executado');
    console.log('🔔 [PROMPT] Checando localStorage...');
    
    // Verifica se já mostrou o prompt antes
    const dismissed = localStorage.getItem('push-notification-prompt-dismissed');
    console.log('🔔 [PROMPT] Valor no localStorage:', dismissed);
    
    if (dismissed) {
      console.log('⚠️ [PROMPT] Card foi dismissed anteriormente');
      setIsDismissed(true);
    } else {
      console.log('✅ [PROMPT] Card nunca foi dismissed');
    }
  }, []);

  useEffect(() => {
    console.log('🔔 [PROMPT] Estado atualizado:', { isSupported, isSubscribed, isLoading, permission, isDismissed });
  }, [isSupported, isSubscribed, isLoading, permission, isDismissed]);

  const handleActivate = async () => {
    console.log('🔔 [CARD] ========== BOTÃO CLICADO ==========');
    console.log('🔔 [CARD] Estado atual:', { isSupported, isSubscribed, isLoading, permission });
    
    if (!isSupported) {
      console.error('❌ [CARD] Navegador não suporta notificações');
      toast.error('Seu navegador não suporta notificações push');
      return;
    }

    console.log('🔔 [CARD] Mostrando toast de loading...');
    toast.loading('Ativando notificações...', { id: 'activate-push' });
    
    try {
      console.log('🔔 [CARD] Chamando subscribe()...');
      const success = await subscribe();
      console.log('🔔 [CARD] Resultado do subscribe:', success);
      
      if (success) {
        toast.success('✅ Notificações ativadas com sucesso!', { id: 'activate-push', duration: 5000 });
        localStorage.setItem('push-notification-prompt-dismissed', 'true');
        setIsDismissed(true);
      } else {
        toast.error('❌ Não foi possível ativar as notificações', { id: 'activate-push' });
      }
    } catch (error: any) {
      console.error('❌ [CARD] Erro capturado:', error);
      toast.error(`Erro: ${error.message}`, { id: 'activate-push' });
    }
  };

  const handleDismiss = () => {
    console.log('🔔 [CARD] Botão X clicado - dispensando card');
    setIsDismissed(true);
    localStorage.setItem('push-notification-prompt-dismissed', 'true');
  };

  console.log('🔔 [PROMPT] Checando condições de exibição...');
  console.log('🔔 [PROMPT] isDismissed:', isDismissed);
  console.log('🔔 [PROMPT] isSubscribed:', isSubscribed);
  console.log('🔔 [PROMPT] isSupported:', isSupported);
  console.log('🔔 [PROMPT] permission:', permission);

  // Não mostra se já foi dismissed, já está inscrito, ou não é suportado
  if (isDismissed || isSubscribed || !isSupported) {
    console.log('🔔 [PROMPT] ❌ Card NÃO será exibido. Razão:', 
      isDismissed ? 'dismissed' : isSubscribed ? 'já inscrito' : 'não suportado'
    );
    return null;
  }

  console.log('🔔 [PROMPT] ✅ Card SERÁ exibido!');

  // Mostra aviso se permissão foi negada
  if (permission === 'denied') {
    console.log('🔔 [PROMPT] Mostrando aviso de permissão negada');
    return (
      <PainelClienteCard variant="warning" className="mb-6">
        <PainelClienteCardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <div>
              <PainelClienteCardTitle className="text-urbana-light">
                Notificações Bloqueadas
              </PainelClienteCardTitle>
              <PainelClienteCardDescription className="text-urbana-light/70">
                Você bloqueou as notificações. Para ativar, acesse as configurações do navegador.
              </PainelClienteCardDescription>
            </div>
          </div>
        </PainelClienteCardHeader>
      </PainelClienteCard>
    );
  }

  // Mostra card persistente no topo do dashboard
  console.log('🔔 [PROMPT] Renderizando card de ativação');
  
  return (
    <PainelClienteCard variant="info" className="mb-6 border-2 border-blue-500/30">
      <PainelClienteCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-blue-500/20 rounded-full p-3">
              <Bell className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <PainelClienteCardTitle className="text-xl text-urbana-light">
                🔔 Ative as Notificações Push
              </PainelClienteCardTitle>
              <PainelClienteCardDescription className="text-urbana-light/70">
                Não perca seus agendamentos! Receba lembretes automáticos.
              </PainelClienteCardDescription>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-urbana-light/60 hover:text-urbana-light transition-colors"
            aria-label="Dispensar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </PainelClienteCardHeader>

      <PainelClienteCardContent className="space-y-4">
        <div className="bg-urbana-black/30 backdrop-blur-sm rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-urbana-light">📅 Você receberá:</p>
          <ul className="space-y-1 text-sm text-urbana-light/80">
            <li className="flex items-center gap-2">
              <span className="text-urbana-gold">•</span>
              <span>Lembrete <strong className="text-urbana-light">24 horas antes</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-urbana-gold">•</span>
              <span>Lembrete <strong className="text-urbana-light">4 horas antes</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-urbana-gold">•</span>
              <span>Notificações mesmo com o app fechado</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={() => {
            console.log('🔔 [BOTÃO] Evento onClick disparado!');
            handleActivate();
          }}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 text-base"
          type="button"
        >
          <Bell className="h-5 w-5 mr-2" />
          {isLoading ? 'Ativando...' : 'Ativar Notificações Agora'}
        </Button>
      </PainelClienteCardContent>
    </PainelClienteCard>
  );
};

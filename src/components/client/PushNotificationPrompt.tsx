import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PainelClienteCard, PainelClienteCardHeader, PainelClienteCardTitle, PainelClienteCardDescription, PainelClienteCardContent } from '@/components/painel-cliente/PainelClienteCard';
import { toast } from 'sonner';

export const PushNotificationPrompt: React.FC = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Verifica se já mostrou o prompt antes
    const dismissed = localStorage.getItem('push-notification-prompt-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleActivate = async () => {
    console.log('🔔 [CARD] Botão ATIVAR clicado!');
    
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações push');
      return;
    }

    toast.loading('Ativando notificações...', { id: 'activate-push' });
    
    try {
      const success = await subscribe();
      
      if (success) {
        toast.success('✅ Notificações ativadas com sucesso!', { id: 'activate-push', duration: 5000 });
        localStorage.setItem('push-notification-prompt-dismissed', 'true');
        setIsDismissed(true);
      } else {
        toast.error('❌ Não foi possível ativar as notificações', { id: 'activate-push' });
      }
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast.error(`Erro: ${error.message}`, { id: 'activate-push' });
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('push-notification-prompt-dismissed', 'true');
  };

  // Não mostra se já foi dismissed, já está inscrito, ou não é suportado
  if (isDismissed || isSubscribed || !isSupported) {
    return null;
  }

  // Mostra aviso se permissão foi negada
  if (permission === 'denied') {
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
          onClick={handleActivate}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 text-base"
        >
          <Bell className="h-5 w-5 mr-2" />
          {isLoading ? 'Ativando...' : 'Ativar Notificações Agora'}
        </Button>
      </PainelClienteCardContent>
    </PainelClienteCard>
  );
};

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PainelClienteCard, PainelClienteCardHeader, PainelClienteCardTitle, PainelClienteCardDescription, PainelClienteCardContent } from '@/components/painel-cliente/PainelClienteCard';

export const PushNotificationPrompt: React.FC = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Verifica se já mostrou o prompt antes
    const dismissed = localStorage.getItem('push-notification-prompt-dismissed');
    
    if (!dismissed && isSupported && !isSubscribed && permission === 'default') {
      // Mostra o prompt após 3 segundos
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, permission]);

  const handleActivate = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
      localStorage.setItem('push-notification-prompt-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('push-notification-prompt-dismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <PainelClienteCard variant="info" className="relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-urbana-light/60 hover:text-urbana-light transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <PainelClienteCardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 rounded-full p-3">
              <Bell className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <PainelClienteCardTitle className="text-xl text-urbana-light">
                Ativar Notificações
              </PainelClienteCardTitle>
              <PainelClienteCardDescription className="text-urbana-light/70">
                Não perca seus agendamentos
              </PainelClienteCardDescription>
            </div>
          </div>
        </PainelClienteCardHeader>

        <PainelClienteCardContent className="space-y-4">
          <p className="text-sm text-urbana-light/80">
            Receba lembretes automáticos <strong className="text-urbana-light">24 horas</strong> e{' '}
            <strong className="text-urbana-light">4 horas</strong> antes dos seus agendamentos.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleActivate}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Ativando...' : 'Ativar Notificações'}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="border-urbana-gold/30 text-urbana-light hover:bg-transparent hover:text-urbana-light hover:border-urbana-gold/30"
            >
              Agora Não
            </Button>
          </div>
        </PainelClienteCardContent>
      </PainelClienteCard>
    </div>
  );
};

import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { 
  PainelClienteCard, 
  PainelClienteCardHeader, 
  PainelClienteCardTitle, 
  PainelClienteCardDescription,
  PainelClienteCardContent 
} from '@/components/painel-cliente/PainelClienteCard';

export const NotificationSettings: React.FC = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <PainelClienteCard variant="warning">
        <PainelClienteCardHeader>
          <PainelClienteCardTitle className="text-urbana-light">
            Notificações não suportadas
          </PainelClienteCardTitle>
          <PainelClienteCardDescription className="text-urbana-light/70">
            Seu navegador não suporta notificações push
          </PainelClienteCardDescription>
        </PainelClienteCardHeader>
      </PainelClienteCard>
    );
  }

  return (
    <PainelClienteCard>
      <PainelClienteCardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 rounded-full p-3">
            <Bell className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <PainelClienteCardTitle className="text-urbana-light">
              Notificações de Agendamento
            </PainelClienteCardTitle>
            <PainelClienteCardDescription className="text-urbana-light/70">
              Receba lembretes automáticos sobre seus agendamentos
            </PainelClienteCardDescription>
          </div>
        </div>
      </PainelClienteCardHeader>

      <PainelClienteCardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-urbana-black/30 backdrop-blur-sm rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-urbana-light">Status</p>
              <p className="text-sm text-urbana-light/70">
                {isSubscribed ? 'Notificações ativadas' : 'Notificações desativadas'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSubscribed 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isSubscribed ? 'Ativo' : 'Inativo'}
            </div>
          </div>

          {permission === 'denied' && (
            <div className="p-3 bg-amber-500/10 border border-amber-400/20 rounded-lg">
              <p className="text-sm text-amber-300">
                Você negou a permissão de notificações. Para ativar, você precisa habilitar nas 
                configurações do seu navegador.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-urbana-light">Como funciona:</p>
          <ul className="space-y-1 text-sm text-urbana-light/80">
            <li className="flex items-start gap-2">
              <span className="text-urbana-gold">•</span>
              <span>Lembrete <strong className="text-urbana-light">24 horas</strong> antes do agendamento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-urbana-gold">•</span>
              <span>Lembrete final <strong className="text-urbana-light">4 horas</strong> antes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-urbana-gold">•</span>
              <span>Notificações aparecem mesmo com o app fechado</span>
            </li>
          </ul>
        </div>

        <div className="pt-2">
          {isSubscribed ? (
            <Button
              onClick={unsubscribe}
              disabled={isLoading}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
            >
              <BellOff className="h-4 w-4 mr-2" />
              {isLoading ? 'Desativando...' : 'Desativar Notificações'}
            </Button>
          ) : (
            <Button
              onClick={subscribe}
              disabled={isLoading || permission === 'denied'}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Ativando...' : 'Ativar Notificações'}
            </Button>
          )}
        </div>
      </PainelClienteCardContent>
    </PainelClienteCard>
  );
};

import React from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { 
  PainelClienteCard, 
  PainelClienteCardHeader, 
  PainelClienteCardTitle, 
  PainelClienteCardDescription,
  PainelClienteCardContent 
} from '@/components/painel-cliente/PainelClienteCard';

export const NotificationSettings: React.FC = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();

  const handleSubscribe = async () => {
    console.log('🔔 [SETTINGS] Iniciando ativação...');
    toast.loading('Ativando notificações...', { id: 'subscribe' });
    
    try {
      const success = await subscribe();
      if (success) {
        toast.success('✅ Notificações ativadas!', { id: 'subscribe', duration: 5000 });
      } else {
        toast.error('❌ Falha ao ativar', { id: 'subscribe' });
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: 'subscribe' });
    }
  };

  const handleUnsubscribe = async () => {
    toast.loading('Desativando notificações...', { id: 'unsubscribe' });
    
    try {
      const success = await unsubscribe();
      if (success) {
        toast.success('Notificações desativadas', { id: 'unsubscribe' });
      } else {
        toast.error('Falha ao desativar', { id: 'unsubscribe' });
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: 'unsubscribe' });
    }
  };

  if (!isSupported) {
    return (
      <PainelClienteCard variant="warning">
        <PainelClienteCardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-400" />
            <div>
              <PainelClienteCardTitle className="text-urbana-light">
                Notificações Não Suportadas
              </PainelClienteCardTitle>
              <PainelClienteCardDescription className="text-urbana-light/70">
                Seu navegador não suporta notificações push
              </PainelClienteCardDescription>
            </div>
          </div>
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
          <div className="flex items-center justify-between p-4 bg-urbana-black/40 backdrop-blur-sm rounded-lg border border-urbana-gold/20">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isSubscribed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <p className="font-semibold text-urbana-light">Status das Notificações</p>
              </div>
              <p className="text-sm text-urbana-light/70">
                {isSubscribed ? '✅ Você receberá lembretes automáticos' : '⚠️ Você não receberá lembretes'}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${
              isSubscribed 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {isSubscribed ? 'ATIVO' : 'INATIVO'}
            </div>
          </div>

          {permission === 'denied' && (
            <div className="p-4 bg-red-500/10 border-2 border-red-400/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-300 mb-1">Permissão Negada</p>
                  <p className="text-sm text-red-200/80">
                    Você bloqueou as notificações. Para reativar:
                  </p>
                  <ol className="text-xs text-red-200/70 mt-2 ml-4 list-decimal space-y-1">
                    <li>Clique no ícone de cadeado na barra de endereço</li>
                    <li>Procure por "Notificações"</li>
                    <li>Altere para "Permitir"</li>
                    <li>Recarregue a página</li>
                  </ol>
                </div>
              </div>
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

        <div className="pt-2 space-y-2">
          {isSubscribed ? (
            <Button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 font-semibold py-3"
            >
              <BellOff className="h-5 w-5 mr-2" />
              {isLoading ? 'Desativando...' : 'Desativar Notificações'}
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || permission === 'denied'}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bell className="h-5 w-5 mr-2" />
              {isLoading ? 'Ativando...' : 'Ativar Notificações'}
            </Button>
          )}
          
          {permission === 'denied' && (
            <p className="text-xs text-center text-red-300/70">
              Configure as permissões do navegador primeiro
            </p>
          )}
        </div>
      </PainelClienteCardContent>
    </PainelClienteCard>
  );
};

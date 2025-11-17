import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidPublicKey, setVapidPublicKey] = useState<string>('');

  useEffect(() => {
    console.log('🔔 usePushNotifications: Hook inicializado');
    // Verifica se o navegador suporta notificações
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      console.log('✅ Navegador suporta notificações push');
      setIsSupported(true);
      setPermission(Notification.permission);
      console.log('🔔 Permissão atual:', Notification.permission);
      checkSubscription();
      loadVapidPublicKey();
    } else {
      console.error('❌ Navegador NÃO suporta notificações push');
    }
  }, []);

  const loadVapidPublicKey = async () => {
    console.log('🔔 usePushNotifications: Carregando VAPID public key...');
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');

      if (error) {
        console.error('❌ Erro ao carregar VAPID public key:', error);
        return;
      }

      if (data?.publicKey) {
        setVapidPublicKey(data.publicKey);
        console.log('✅ VAPID public key carregada com sucesso');
      } else {
        console.error('❌ VAPID public key não encontrada na resposta');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar VAPID key:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    console.log('🔔 usePushNotifications: Função subscribe() chamada');
    console.log('🔔 isSupported:', isSupported);
    console.log('🔔 vapidPublicKey:', vapidPublicKey ? 'Carregada' : 'NÃO carregada');
    
    if (!isSupported) {
      console.error('❌ Notificações não são suportadas neste navegador');
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    if (!vapidPublicKey) {
      console.error('❌ VAPID key não configurada');
      toast.error('VAPID key não configurada. Peça ao administrador para gerar as chaves VAPID.');
      return false;
    }

    setIsLoading(true);
    console.log('🔔 Solicitando permissão ao usuário...');

    try {
      // Solicita permissão
      const permissionResult = await Notification.requestPermission();
      console.log('🔔 Resultado da permissão:', permissionResult);
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.error('❌ Permissão negada pelo usuário');
        toast.error('Permissão de notificação negada');
        setIsLoading(false);
        return false;
      }
      
      console.log('✅ Permissão concedida!');

      // Registra service worker
      console.log('🔔 Aguardando service worker...');
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker pronto!');

      // Cria subscrição
      console.log('🔔 Criando subscrição push...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log('✅ Subscrição criada:', subscription.endpoint);

      // Converte para formato JSON
      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        },
      };
      console.log('✅ Dados da subscrição preparados');

      // Salva no banco de dados
      console.log('🔔 Buscando usuário autenticado...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast.error('Usuário não autenticado');
        setIsLoading(false);
        return false;
      }
      console.log('✅ Usuário encontrado:', user.email);

      // Busca o cliente pelo email
      console.log('🔔 Buscando cliente no banco...');
      const { data: cliente } = await supabase
        .from('painel_clientes')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!cliente) {
        console.error('❌ Cliente não encontrado para o email:', user.email);
        toast.error('Cliente não encontrado');
        setIsLoading(false);
        return false;
      }
      console.log('✅ Cliente encontrado:', cliente.id);

      console.log('🔔 Salvando token no banco de dados...');
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          client_id: cliente.id,
          subscription_data: subscriptionData as any,
          user_agent: navigator.userAgent,
          is_active: true,
          last_used_at: new Date().toISOString(),
        });

      if (error) throw error;
      console.log('✅ Token salvo com sucesso!');

      setIsSubscribed(true);
      toast.success('Notificações ativadas com sucesso!');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('❌ Erro ao ativar notificações:', error);
      toast.error('Erro ao ativar notificações');
      setIsLoading(false);
      return false;
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove do banco de dados
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cliente } = await supabase
            .from('painel_clientes')
            .select('id')
            .eq('email', user.email)
            .single();

          if (cliente) {
            await supabase
              .from('push_notification_tokens')
              .delete()
              .eq('client_id', cliente.id);
          }
        }
      }

      setIsSubscribed(false);
      toast.success('Notificações desativadas');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
      toast.error('Erro ao desativar notificações');
      setIsLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
};

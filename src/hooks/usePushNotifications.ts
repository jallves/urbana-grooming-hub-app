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

// Fallback VAPID key se edge function falhar
const FALLBACK_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || null;

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const initializePushNotifications = async () => {
      console.log('🔔 [PUSH] ===== INICIALIZANDO SISTEMA DE NOTIFICAÇÕES =====');
      
      // Verificar suporte do navegador
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      console.log('📱 [PUSH] Suporte:', supported ? '✅ SIM' : '❌ NÃO');
      setIsSupported(supported);
      
      if (supported) {
        const currentPermission = Notification.permission;
        setPermission(currentPermission);
        console.log('🔐 [PUSH] Permissão atual:', currentPermission);
        
        await loadVapidPublicKey();
        await checkSubscription();
      } else {
        console.warn('⚠️ [PUSH] Navegador não suporta notificações push');
      }
      
      setIsLoading(false);
      console.log('🔔 [PUSH] ===== INICIALIZAÇÃO COMPLETA =====');
    };

    initializePushNotifications();
  }, []);

  const loadVapidPublicKey = async () => {
    try {
      console.log('🔑 [PUSH] Carregando VAPID public key...');
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
      
      if (error) {
        console.error('❌ [PUSH] Erro ao carregar VAPID key do edge function:', error);
        
        if (FALLBACK_VAPID_KEY) {
          console.log('🔄 [PUSH] Usando VAPID key de fallback');
          setVapidPublicKey(FALLBACK_VAPID_KEY);
          return;
        }
        
        throw error;
      }
      
      if (data?.publicKey) {
        console.log('✅ [PUSH] VAPID key carregada com sucesso');
        setVapidPublicKey(data.publicKey);
      } else {
        console.error('❌ [PUSH] VAPID key não encontrada na resposta');
      }
    } catch (error) {
      console.error('❌ [PUSH] Erro ao buscar VAPID key:', error);
      
      if (FALLBACK_VAPID_KEY) {
        console.log('🔄 [PUSH] Usando VAPID key de fallback após erro');
        setVapidPublicKey(FALLBACK_VAPID_KEY);
      }
    }
  };

  const checkSubscription = async () => {
    try {
      console.log('🔍 [PUSH] Verificando subscription existente...');
      
      // Verificar se service worker está pronto
      if (!navigator.serviceWorker.controller) {
        console.log('⏳ [PUSH] Service Worker não está controlando a página ainda');
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ [PUSH] Service Worker ready');
      
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('✅ [PUSH] Subscription encontrada:', subscription.endpoint.substring(0, 50) + '...');
        
        // Verificar se token está ativo no backend
        const clienteToken = localStorage.getItem('painel_cliente_token');
        let clientId = null;

        if (clienteToken) {
          clientId = clienteToken;
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('⚠️ [PUSH] Usuário não autenticado');
            setIsSubscribed(false);
            return;
          }

          const { data: clientData } = await supabase
            .from('painel_clientes')
            .select('id')
            .eq('email', user.email)
            .single();

          if (clientData) {
            clientId = clientData.id;
          }
        }

        if (clientId) {
          const { data: tokens, error } = await supabase
            .from('push_notification_tokens')
            .select('*')
            .eq('client_id', clientId)
            .eq('is_active', true);
          
          if (error) {
            console.error('❌ [PUSH] Erro ao buscar tokens:', error);
          }
          
          if (tokens && tokens.length > 0) {
            console.log('✅ [PUSH] Token ativo encontrado no backend');
            setIsSubscribed(true);
            return;
          }
        }
        
        console.log('⚠️ [PUSH] Subscription encontrada mas token não está no backend');
        setIsSubscribed(false);
      } else {
        console.log('ℹ️ [PUSH] Nenhuma subscription encontrada');
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('❌ [PUSH] Erro ao verificar subscription:', error);
      setIsSubscribed(false);
    }
  };

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const subscribe = async () => {
    try {
      console.log('🚀 [PUSH] ========== INICIANDO PROCESSO DE SUBSCRIPTION ==========');
      setIsLoading(true);

      // 1. Verificar suporte
      if (!isSupported) {
        throw new Error('Notificações push não são suportadas neste navegador');
      }

      // 2. Solicitar permissão
      console.log('📱 [PUSH] Solicitando permissão de notificação...');
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      console.log('🔐 [PUSH] Resultado da permissão:', permissionResult);

      if (permissionResult !== 'granted') {
        console.warn('⚠️ [PUSH] Permissão negada pelo usuário');
        throw new Error('Permissão de notificação negada');
      }

      // 3. Verificar VAPID key
      if (!vapidPublicKey) {
        console.error('❌ [PUSH] VAPID public key não disponível');
        throw new Error('VAPID public key não configurada. Peça ao administrador para configurar as notificações push.');
      }

      // 4. Verificar/registrar Service Worker
      console.log('🔍 [PUSH] Verificando service workers registrados...');
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📝 [PUSH] ${existingRegistrations.length} service worker(s) encontrado(s)`);

      let registration: ServiceWorkerRegistration;

      if (existingRegistrations.length > 0) {
        registration = existingRegistrations[0];
        console.log('♻️ [PUSH] Usando service worker existente:', registration.scope);
      } else {
        console.log('📝 [PUSH] Registrando novo service worker...');
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('✅ [PUSH] Service worker registrado:', registration.scope);
      }

      // 5. Aguardar service worker estar pronto
      console.log('⏳ [PUSH] Aguardando service worker ficar pronto...');
      const readyRegistration = await navigator.serviceWorker.ready;
      console.log('✅ [PUSH] Service worker pronto e ativo');

      // 6. Limpar subscription antiga se existir
      const existingSubscription = await readyRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('🔄 [PUSH] Removendo subscription antiga...');
        await existingSubscription.unsubscribe();
      }

      // 7. Criar nova push subscription
      console.log('🔔 [PUSH] Criando nova push subscription...');
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
      });

      console.log('✅ [PUSH] Push subscription criada:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        hasKeys: !!subscription.getKey('p256dh')
      });

      // 8. Obter client ID
      const clienteToken = localStorage.getItem('painel_cliente_token');
      let clientId = null;

      if (clienteToken) {
        clientId = clienteToken;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuário não autenticado. Faça login novamente.');
        }

        const { data: clientData } = await supabase
          .from('painel_clientes')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!clientData) {
          throw new Error('Cliente não encontrado.');
        }

        clientId = clientData.id;
      }

      console.log('👤 [PUSH] Cliente ID:', clientId);

      // 9. Enviar subscription para o backend
      console.log('💾 [PUSH] Enviando subscription para o backend...');
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        }
      };

      const { data, error } = await supabase.functions.invoke('register-push-token', {
        body: {
          clientId,
          subscriptionData,
          userAgent: navigator.userAgent
        }
      });

      if (error) {
        console.error('❌ [PUSH] Erro ao registrar token no backend:', error);
        throw error;
      }

      console.log('✅ [PUSH] Token registrado no backend:', data);
      console.log('🎉 [PUSH] ========== NOTIFICAÇÕES PUSH ATIVADAS COM SUCESSO! ==========');
      
      setIsSubscribed(true);
      toast.success('Notificações push ativadas com sucesso! 🎉');
      
      return true;
    } catch (error: any) {
      console.error('❌ [PUSH] ========== ERRO AO ATIVAR NOTIFICAÇÕES ==========');
      console.error('❌ [PUSH] Erro completo:', error);
      console.error('❌ [PUSH] Stack trace:', error.stack);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao ativar notificações';
      
      if (error.message?.includes('Permission') || error.message?.includes('Permissão')) {
        errorMessage = 'Permissão negada. Verifique as configurações do navegador e recarregue a página.';
      } else if (error.message?.includes('VAPID')) {
        errorMessage = 'Configuração de notificações incompleta. Contate o administrador.';
      } else if (error.message?.includes('Service Worker')) {
        errorMessage = 'Erro ao registrar service worker. Recarregue a página e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      console.log('🔕 [PUSH] Iniciando processo de desinscrição...');
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('🔕 [PUSH] Cancelando subscription...');
        await subscription.unsubscribe();
        console.log('✅ [PUSH] Subscription cancelada');

        const clienteToken = localStorage.getItem('painel_cliente_token');
        let clientId = null;

        if (clienteToken) {
          clientId = clienteToken;
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: clientData } = await supabase
              .from('painel_clientes')
              .select('id')
              .eq('email', user.email)
              .single();

            if (clientData) {
              clientId = clientData.id;
            }
          }
        }

        if (clientId) {
          await supabase
            .from('push_notification_tokens')
            .update({ is_active: false })
            .eq('client_id', clientId);
          
          console.log('✅ [PUSH] Token desativado no backend');
        }

        setIsSubscribed(false);
        toast.success('Notificações desativadas');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [PUSH] Erro ao desinscrever:', error);
      toast.error('Erro ao desativar notificações');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  };
};

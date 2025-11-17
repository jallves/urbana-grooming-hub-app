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

  // Função para revalidar permissões em tempo real
  const revalidatePermission = () => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      console.log('🔄 [REVALIDATE] Permissão atual:', currentPermission);
      
      if (currentPermission !== permission) {
        console.log('⚡ [REVALIDATE] Permissão mudou!', permission, '->', currentPermission);
        setPermission(currentPermission);
        
        // Se mudou para granted, verificar subscrição
        if (currentPermission === 'granted') {
          checkSubscription();
        }
      }
      
      return currentPermission;
    }
    return 'default';
  };

  useEffect(() => {
    // Log bem visível
    console.log('%c🔔 PUSH NOTIFICATIONS HOOK INICIADO', 'background: #222; color: #bada55; font-size: 16px; padding: 4px;');
    
    // Verifica se o navegador suporta notificações
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      console.log('%c✅ Navegador suporta notificações push', 'color: green; font-weight: bold');
      setIsSupported(true);
      setPermission(Notification.permission);
      console.log('%c🔔 Permissão atual: ' + Notification.permission, 'color: blue');
      
      checkSubscription();
      loadVapidPublicKey();

      // Monitorar mudanças de visibilidade da página para revalidar
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('👁️ Página ficou visível - revalidando permissões...');
          revalidatePermission();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Polling a cada 5 segundos quando a página está ativa (detecta mudanças nas configurações do navegador)
      const pollInterval = setInterval(() => {
        if (!document.hidden) {
          revalidatePermission();
        }
      }, 5000);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(pollInterval);
      };
    } else {
      console.error('%c❌ Navegador NÃO suporta notificações push', 'color: red; font-weight: bold');
      toast.error('Seu navegador não suporta notificações push');
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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('⚠️ [PUSH] Navegador não suporta Service Worker ou PushManager');
      return;
    }

    try {
      console.log('🔍 [PUSH] Iniciando verificação de subscrição...');
      
      // 1. Verificar Service Worker
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ [PUSH] Service Worker pronto');
      
      // 2. Verificar subscrição local no navegador
      const subscription = await registration.pushManager.getSubscription();
      console.log('📋 [PUSH] Subscrição local:', subscription ? 'EXISTE' : 'NÃO EXISTE');
      
      if (!subscription) {
        console.log('❌ [PUSH] Sem subscrição local no navegador');
        setIsSubscribed(false);
        return;
      }
      
      // 3. Verificar se o token existe no banco de dados
      console.log('🔍 [PUSH] Verificando token no banco de dados...');
      
      // Tentar pegar cliente ID do sistema customizado do painel primeiro
      const clienteToken = localStorage.getItem('painel_cliente_token');
      let clientId = null;

      if (clienteToken) {
        console.log('🔍 [PUSH] Tentando autenticação via painel customizado...');
        clientId = clienteToken;
      } else {
        console.log('🔍 [PUSH] Tentando autenticação via Supabase Auth...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⚠️ [PUSH] Usuário não autenticado em nenhum sistema');
          setIsSubscribed(false);
          return;
        }

        // Buscar cliente_id usando painel_clientes
        const { data: clientData } = await supabase
          .from('painel_clientes')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!clientData) {
          console.log('⚠️ [PUSH] Cliente não encontrado no banco');
          setIsSubscribed(false);
          return;
        }

        clientId = clientData.id;
      }

      console.log('✅ [PUSH] Cliente ID identificado:', clientId);

      // Verificar tokens ativos no banco
      const { data: tokens, error: tokenError } = await supabase
        .from('push_notification_tokens')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (tokenError) {
        console.error('❌ [PUSH] Erro ao buscar tokens:', tokenError);
        setIsSubscribed(false);
        return;
      }

      const hasTokenInDb = tokens && tokens.length > 0;
      console.log('💾 [PUSH] Tokens no banco:', hasTokenInDb ? `${tokens.length} encontrado(s)` : 'NENHUM');
      
      // Se tem subscrição local mas não tem no banco, há divergência
      if (!hasTokenInDb) {
        console.log('⚠️ [PUSH] DIVERGÊNCIA: Subscrição local existe mas token não está no banco!');
        setIsSubscribed(false);
      } else {
        console.log('✅ [PUSH] Status verificado: ATIVO (token no banco confirmado)');
        setIsSubscribed(true);
      }
      
    } catch (error) {
      console.error('❌ [PUSH] Erro ao verificar subscrição:', error);
      setIsSubscribed(false);
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
    console.log('%c🔔 ========== INICIANDO SUBSCRIÇÃO DE PUSH ==========', 'background: #4CAF50; color: white; font-size: 14px; padding: 8px;');
    
    // REVALIDAR PERMISSÕES ANTES DE TENTAR
    console.log('🔄 [SUBSCRIBE] Revalidando permissões antes de prosseguir...');
    const currentPermission = revalidatePermission();
    
    console.log('🔔 isSupported:', isSupported);
    console.log('🔔 currentPermission:', currentPermission);
    console.log('🔔 vapidPublicKey:', vapidPublicKey ? 'Carregada ✅' : 'NÃO carregada ❌');
    
    if (!isSupported) {
      console.error('%c❌ Notificações não suportadas', 'color: red; font-weight: bold');
      toast.error('Notificações não são suportadas neste navegador');
      setIsLoading(false);
      return false;
    }

    // Verificar se a permissão já está denied ANTES de tentar
    if (currentPermission === 'denied') {
      console.error('%c❌ Permissão NEGADA - usuário precisa desbloquear manualmente', 'color: red; font-weight: bold');
      toast.error('Notificações bloqueadas. Por favor, desbloqueie nas configurações do navegador e clique em "Verificar Novamente".', {
        duration: 5000
      });
      setIsLoading(false);
      return false;
    }

    if (!vapidPublicKey) {
      console.error('%c❌ VAPID key não configurada', 'color: red; font-weight: bold');
      toast.error('Aguarde... carregando configurações');
      
      // Tentar carregar novamente
      await loadVapidPublicKey();
      
      // Verificar novamente após tentar carregar
      if (!vapidPublicKey) {
        toast.error('Erro ao carregar configurações. Tente novamente.');
        setIsLoading(false);
        return false;
      }
    }

    setIsLoading(true);
    toast.loading('Ativando notificações...', { id: 'push-subscribe' });

    try {
      // PASSO 1: Solicitar permissão
      console.log('🔔 [PUSH] PASSO 1/5: Solicitando permissão...');
      const permissionResult = await Notification.requestPermission();
      console.log('🔔 [PUSH] Resultado da permissão:', permissionResult);
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.error('❌ [PUSH] Permissão NEGADA');
        toast.error('Permissão de notificação negada. Desbloqueie nas configurações do navegador.', {
          id: 'push-subscribe',
          duration: 5000
        });
        setIsLoading(false);
        return false;
      }
      
      console.log('✅ [PUSH] Permissão CONCEDIDA!');

      // PASSO 2: Registrar e aguardar Service Worker
      console.log('🔔 [PUSH] PASSO 2/5: Registrando Service Worker...');
      await navigator.serviceWorker.register('/sw.js');
      console.log('✅ [PUSH] Service Worker registrado');
      
      console.log('⏳ [PUSH] Aguardando Service Worker estar pronto...');
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ [PUSH] Service Worker PRONTO!', registration.active?.state);

      // PASSO 3: Criar subscrição push
      console.log('🔔 [PUSH] PASSO 3/5: Criando subscrição push...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log('✅ [PUSH] Subscrição criada!');
      console.log('📋 [PUSH] Endpoint:', subscription.endpoint.substring(0, 60) + '...');

      // PASSO 4: Preparar dados da subscrição
      console.log('🔔 [PUSH] PASSO 4/5: Preparando dados da subscrição...');
      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        },
      };
      console.log('✅ [PUSH] Dados preparados');

      // PASSO 5: Salvar no banco de dados
      console.log('🔔 [PUSH] PASSO 5/5: Salvando token no banco...');
      
      // Tentar pegar cliente ID do sistema customizado do painel primeiro
      const clienteToken = localStorage.getItem('painel_cliente_token');
      let clienteId = null;

      if (clienteToken) {
        console.log('🔍 [PUSH] Usando autenticação do painel customizado...');
        clienteId = clienteToken;
      } else {
        console.log('🔍 [PUSH] Buscando usuário via Supabase Auth...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ [PUSH] Usuário NÃO autenticado em nenhum sistema');
          toast.error('Usuário não autenticado. Faça login novamente.');
          setIsLoading(false);
          return false;
        }
        console.log('✅ [PUSH] Usuário autenticado:', user.email);

        // Buscar cliente usando painel_clientes
        console.log('🔍 [PUSH] Buscando cliente no banco...');
        const { data: cliente, error: clientError } = await supabase
          .from('painel_clientes')
          .select('id')
          .eq('email', user.email)
          .single();

        if (clientError) {
          console.error('❌ [PUSH] Erro ao buscar cliente:', clientError);
          toast.error('Erro ao encontrar cliente no banco');
          setIsLoading(false);
          return false;
        }

        if (!cliente) {
          console.error('❌ [PUSH] Cliente não encontrado para email:', user.email);
          toast.error('Cliente não encontrado no sistema');
          setIsLoading(false);
          return false;
        }

        clienteId = cliente.id;
      }
      
      console.log('✅ [PUSH] Cliente ID:', clienteId);

      console.log('💾 [PUSH] Salvando token via edge function...');
      console.log('📤 [PUSH] Dados a serem salvos:', {
        client_id: clienteId,
        endpoint: subscriptionData.endpoint.substring(0, 60) + '...',
        has_keys: !!(subscriptionData.keys.p256dh && subscriptionData.keys.auth)
      });
      
      const { data: insertData, error: saveError } = await supabase.functions.invoke('register-push-token', {
        body: {
          clientId: clienteId,
          subscriptionData: subscriptionData,
          userAgent: navigator.userAgent,
        }
      });

      if (saveError) {
        console.error('❌ [PUSH] ERRO ao salvar token:', saveError);
        console.error('🔴 [PUSH] Código:', saveError.message);
        toast.error(`Erro ao salvar token: ${saveError.message}`);
        setIsLoading(false);
        return false;
      }

      if (insertData?.error) {
        console.error('❌ [PUSH] ERRO retornado pela função:', insertData);
        toast.error(`Erro ao salvar token: ${insertData.message || 'Erro desconhecido'}`);
        setIsLoading(false);
        return false;
      }

      console.log('%c✅ Token salvo com SUCESSO!', 'background: green; color: white; font-size: 14px; padding: 8px;', insertData);
      console.log('%c🔔 ========== SUBSCRIÇÃO CONCLUÍDA ==========', 'background: #4CAF50; color: white; font-size: 14px; padding: 8px;');

      setIsSubscribed(true);
      toast.success('✅ Notificações ativadas com sucesso!', { id: 'push-subscribe' });
      setIsLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('%c❌ ERRO AO ATIVAR NOTIFICAÇÕES', 'background: red; color: white; font-size: 14px; padding: 8px;');
      console.error('🔴 Tipo:', error.name);
      console.error('🔴 Mensagem:', error.message);
      console.error('🔴 Stack:', error.stack);
      
      // Mensagem mais amigável para o usuário
      let errorMessage = 'Erro ao ativar notificações';
      if (error.message.includes('not found')) {
        errorMessage = 'Cliente não encontrado. Faça login novamente.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permissão de notificação negada';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'push-subscribe' });
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
        // Tentar pegar cliente ID do sistema customizado primeiro
        const clienteToken = localStorage.getItem('painel_cliente_token');
        let clienteId = null;

        if (clienteToken) {
          clienteId = clienteToken;
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: cliente } = await supabase
              .from('painel_clientes')
              .select('id')
              .eq('email', user.email)
              .single();

            if (cliente) {
              clienteId = cliente.id;
            }
          }
        }

        if (clienteId) {
          const { error: unregisterError } = await supabase.functions.invoke('unregister-push-token', {
            body: { clientId: clienteId }
          });

          if (unregisterError) {
            console.error('❌ [PUSH] Erro ao remover token:', unregisterError);
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
    revalidatePermission,
  };
};

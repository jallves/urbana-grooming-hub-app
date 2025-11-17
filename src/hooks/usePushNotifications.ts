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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ [PUSH] Usuário não autenticado');
        setIsSubscribed(false);
        return;
      }

      // Buscar cliente_id usando painel_clientes (mesma tabela das RLS policies)
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

      // Verificar tokens ativos no banco
      const { data: tokens, error: tokenError } = await supabase
        .from('push_notification_tokens')
        .select('*')
        .eq('client_id', clientData.id)
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
    console.log('🔔 ========== [PUSH] INICIANDO SUBSCRIÇÃO ==========');
    console.log('🔔 [PUSH] isSupported:', isSupported);
    console.log('🔔 [PUSH] vapidPublicKey:', vapidPublicKey ? 'Carregada ✅' : 'NÃO carregada ❌');
    
    if (!isSupported) {
      console.error('❌ [PUSH] Notificações não suportadas');
      toast.error('Notificações não são suportadas neste navegador');
      setIsLoading(false);
      return false;
    }

    if (!vapidPublicKey) {
      console.error('❌ [PUSH] VAPID key não configurada');
      toast.error('VAPID key não configurada. Peça ao administrador para gerar as chaves VAPID.');
      setIsLoading(false);
      return false;
    }

    setIsLoading(true);

    try {
      // PASSO 1: Solicitar permissão
      console.log('🔔 [PUSH] PASSO 1/5: Solicitando permissão...');
      const permissionResult = await Notification.requestPermission();
      console.log('🔔 [PUSH] Resultado da permissão:', permissionResult);
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.error('❌ [PUSH] Permissão NEGADA');
        toast.error('Permissão de notificação negada. Desbloqueie nas configurações do navegador.');
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
      
      console.log('🔍 [PUSH] Buscando usuário autenticado...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [PUSH] Usuário NÃO autenticado');
        toast.error('Usuário não autenticado. Faça login novamente.');
        setIsLoading(false);
        return false;
      }
      console.log('✅ [PUSH] Usuário autenticado:', user.email);

      // Buscar cliente usando painel_clientes (mesma tabela das RLS policies)
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
      console.log('✅ [PUSH] Cliente encontrado! ID:', cliente.id);

      console.log('💾 [PUSH] Salvando token no banco de dados...');
      console.log('📤 [PUSH] Dados a serem salvos:', {
        client_id: cliente.id,
        endpoint: subscriptionData.endpoint.substring(0, 60) + '...',
        has_keys: !!(subscriptionData.keys.p256dh && subscriptionData.keys.auth)
      });
      
      const { data: insertData, error: saveError } = await supabase
        .from('push_notification_tokens')
        .upsert({
          client_id: cliente.id,
          subscription_data: subscriptionData as any,
          user_agent: navigator.userAgent,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id,subscription_data'
        })
        .select();

      if (saveError) {
        console.error('❌ [PUSH] ERRO ao salvar token:', saveError);
        console.error('🔴 [PUSH] Código:', saveError.code);
        console.error('🔴 [PUSH] Mensagem:', saveError.message);
        console.error('🔴 [PUSH] Detalhes:', saveError.details);
        console.error('🔴 [PUSH] Hint:', saveError.hint);
        toast.error(`Erro ao salvar token: ${saveError.message}`);
        setIsLoading(false);
        return false;
      }

      console.log('✅ [PUSH] Token salvo com SUCESSO!', insertData);
      console.log('🔔 ========== [PUSH] SUBSCRIÇÃO CONCLUÍDA ==========');

      setIsSubscribed(true);
      toast.success('✅ Notificações ativadas com sucesso!');
      setIsLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('❌ [PUSH] ERRO GERAL:', error);
      console.error('🔴 [PUSH] Tipo:', error.name);
      console.error('🔴 [PUSH] Mensagem:', error.message);
      console.error('🔴 [PUSH] Stack:', error.stack);
      toast.error(`Erro ao ativar notificações: ${error.message}`);
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

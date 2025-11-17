import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();
    console.log(`📨 Recebida solicitação de teste de notificação para cliente: ${clientId}`);

    if (!clientId) {
      throw new Error('clientId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar tokens ativos do cliente
    const { data: tokens, error: tokensError } = await supabase
      .from('push_notification_tokens')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (tokensError) {
      console.error('Erro ao buscar tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log(`⚠️ Nenhum token ativo encontrado para o cliente ${clientId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Este cliente não possui nenhum token de notificação ativo. O cliente precisa ativar as notificações push no dispositivo primeiro.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📱 Encontrados ${tokens.length} token(s) para o cliente ${clientId}`);

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      throw new Error('VAPID keys não configuradas');
    }

    // Payload da notificação de teste
    const notification: NotificationPayload = {
      title: '🧪 Teste de Notificação',
      body: 'Se você recebeu esta notificação, o sistema está funcionando perfeitamente! ✅',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: '/cliente/agendamentos',
        test: true
      }
    };

    let successCount = 0;
    let errorCount = 0;

    // Enviar notificação para cada token
    for (const tokenRecord of tokens) {
      try {
        const subscription = tokenRecord.subscription_data;

        const webpush = await import('npm:web-push@3.6.6');
        webpush.default.setVapidDetails(
          vapidEmail,
          vapidPublicKey,
          vapidPrivateKey
        );

        await webpush.default.sendNotification(
          subscription,
          JSON.stringify(notification)
        );

        console.log(`✅ Notificação de teste enviada para token ${tokenRecord.id}`);
        successCount++;

        // Atualizar last_used_at
        await supabase
          .from('push_notification_tokens')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', tokenRecord.id);

      } catch (error: any) {
        console.error(`❌ Erro ao enviar para token ${tokenRecord.id}:`, error);
        errorCount++;

        // Se o token está inválido (410 Gone), desativar
        if (error.statusCode === 410) {
          await supabase
            .from('push_notification_tokens')
            .update({ is_active: false })
            .eq('id', tokenRecord.id);
          console.log(`🗑️ Token ${tokenRecord.id} desativado (410 Gone)`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `✅ Teste concluído! ${successCount} notificação(ões) enviada(s) com sucesso.`,
        stats: {
          total: tokens.length,
          success: successCount,
          errors: errorCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro ao enviar notificação de teste:', error);
    
    // Mensagens de erro mais específicas
    let errorMessage = 'Erro desconhecido ao enviar notificação';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.message?.includes('clientId é obrigatório')) {
      errorMessage = 'ID do cliente não foi fornecido';
      errorCode = 'MISSING_CLIENT_ID';
    } else if (error.message?.includes('VAPID keys')) {
      errorMessage = 'Chaves VAPID não estão configuradas. Configure-as nas variáveis de ambiente.';
      errorCode = 'VAPID_NOT_CONFIGURED';
    } else if (error.code === 'PGRST116') {
      errorMessage = 'Erro ao acessar o banco de dados. Verifique as permissões.';
      errorCode = 'DATABASE_ERROR';
    } else if (error.statusCode === 410) {
      errorMessage = 'Token de notificação expirado ou inválido';
      errorCode = 'INVALID_TOKEN';
    } else if (error.statusCode === 401) {
      errorMessage = 'Erro de autenticação com o serviço de notificações';
      errorCode = 'AUTH_ERROR';
    } else {
      errorMessage = error.message || errorMessage;
      errorCode = error.code || errorCode;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        errorCode: errorCode,
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

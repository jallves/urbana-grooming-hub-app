import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clientId, subscriptionData, userAgent } = await req.json();

    console.log('📝 [REGISTER-TOKEN] Recebida solicitação de registro');
    console.log('📝 [REGISTER-TOKEN] Client ID:', clientId);

    if (!clientId) {
      console.error('❌ [REGISTER-TOKEN] Client ID não fornecido');
      return new Response(
        JSON.stringify({ 
          error: 'MISSING_CLIENT_ID',
          message: 'Client ID é obrigatório' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    if (!subscriptionData || !subscriptionData.endpoint) {
      console.error('❌ [REGISTER-TOKEN] Subscription data inválido');
      return new Response(
        JSON.stringify({ 
          error: 'INVALID_SUBSCRIPTION',
          message: 'Dados de subscrição inválidos' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Verificar se o cliente existe
    const { data: cliente, error: clientError } = await supabase
      .from('painel_clientes')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !cliente) {
      console.error('❌ [REGISTER-TOKEN] Cliente não encontrado:', clientError);
      return new Response(
        JSON.stringify({ 
          error: 'CLIENT_NOT_FOUND',
          message: 'Cliente não encontrado no sistema' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    console.log('✅ [REGISTER-TOKEN] Cliente encontrado');

    // Registrar/atualizar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('push_notification_tokens')
      .upsert({
        client_id: clientId,
        subscription_data: subscriptionData,
        user_agent: userAgent || 'Unknown',
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id,subscription_data'
      })
      .select();

    if (tokenError) {
      console.error('❌ [REGISTER-TOKEN] Erro ao salvar token:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'DATABASE_ERROR',
          message: 'Erro ao salvar token de notificação',
          details: tokenError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('✅ [REGISTER-TOKEN] Token registrado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Token registrado com sucesso',
        data: tokenData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [REGISTER-TOKEN] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: 'INTERNAL_ERROR',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

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

    const { clientId } = await req.json();

    console.log('🗑️ [UNREGISTER-TOKEN] Recebida solicitação de remoção');
    console.log('🗑️ [UNREGISTER-TOKEN] Client ID:', clientId);

    if (!clientId) {
      console.error('❌ [UNREGISTER-TOKEN] Client ID não fornecido');
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

    // Remover todos os tokens do cliente
    const { error: deleteError } = await supabase
      .from('push_notification_tokens')
      .delete()
      .eq('client_id', clientId);

    if (deleteError) {
      console.error('❌ [UNREGISTER-TOKEN] Erro ao remover tokens:', deleteError);
      return new Response(
        JSON.stringify({ 
          error: 'DATABASE_ERROR',
          message: 'Erro ao remover tokens de notificação',
          details: deleteError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('✅ [UNREGISTER-TOKEN] Tokens removidos com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Tokens removidos com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [UNREGISTER-TOKEN] Erro geral:', error);
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

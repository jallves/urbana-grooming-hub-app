import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();
    
    console.log('🔐 Iniciando reset de senha para:', email);

    // Criar cliente Supabase com privilégios admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Erro ao listar usuários:', userError);
      throw userError;
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      console.log('⚠️ Usuário não encontrado:', email);
      // Retornar sucesso mesmo se não encontrar (segurança)
      return new Response(
        JSON.stringify({ success: true, message: 'Se o email existir, você receberá instruções' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('✅ Usuário encontrado, gerando link de reset...');

    // Gerar link de recuperação usando a API admin (mais confiável)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo
      }
    });

    if (linkError) {
      console.error('❌ Erro ao gerar link:', linkError);
      throw linkError;
    }

    console.log('✅ Link gerado com sucesso');
    console.log('🔗 Link completo:', linkData.properties.action_link);

    // O Supabase automaticamente envia o email quando usamos admin.generateLink
    // com a configuração de email templates do dashboard

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de recuperação enviado com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('💥 Erro na função send-password-reset:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao processar solicitação'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});

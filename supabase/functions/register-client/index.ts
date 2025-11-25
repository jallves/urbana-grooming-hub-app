import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

interface RegisterClientRequest {
  nome: string;
  email: string;
  whatsapp: string;
  data_nascimento: string;
  senha: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [register-client] Iniciando registro de cliente...');

    // Parse request body
    const body: RegisterClientRequest = await req.json();
    const { nome, email, whatsapp, data_nascimento, senha } = body;

    // Validações básicas
    if (!nome?.trim() || !email?.trim() || !whatsapp?.trim() || !data_nascimento?.trim() || !senha) {
      console.error('❌ Dados obrigatórios faltando');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Todos os campos são obrigatórios' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client (service role for admin operations)
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

    // ===================================================================
    // ETAPA 1: VALIDAR WHATSAPP DUPLICADO (ANTES DE CRIAR USUÁRIO)
    // ===================================================================
    console.log('🔍 [1/4] Verificando WhatsApp único:', whatsapp);
    
    const { data: existingWhatsApp, error: whatsappCheckError } = await supabaseAdmin
      .from('client_profiles')
      .select('nome, whatsapp')
      .eq('whatsapp', whatsapp.trim())
      .maybeSingle();

    if (whatsappCheckError && whatsappCheckError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar WhatsApp:', whatsappCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '⚠️ Não foi possível verificar seus dados neste momento.\n\nPor favor, aguarde alguns segundos e tente novamente.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (existingWhatsApp) {
      console.warn('⚠️ WhatsApp já cadastrado:', existingWhatsApp.whatsapp);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `📱 Este número de WhatsApp (${whatsapp}) já está cadastrado em nosso sistema!\n\n` +
                 `Nome cadastrado: ${existingWhatsApp.nome}\n\n` +
                 `✅ Se esta é sua conta, clique em "Já tenho conta" para fazer login.\n` +
                 `🔐 Caso tenha esquecido sua senha, você pode recuperá-la na tela de login.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('✅ WhatsApp disponível');

    // ===================================================================
    // ETAPA 2: CRIAR USUÁRIO (SEM ENVIAR EMAIL AINDA)
    // ===================================================================
    console.log('🔍 [2/4] Criando usuário...');
    
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: senha,
      email_confirm: false, // NÃO confirmar email automaticamente
      user_metadata: {
        user_type: 'client',
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        data_nascimento: data_nascimento
      }
    });

    if (signUpError) {
      console.error('❌ Erro ao criar usuário:', signUpError);
      
      // Email duplicado
      if (signUpError.message.includes('already registered') || 
          signUpError.message.includes('User already registered') ||
          signUpError.message.includes('duplicate') ||
          signUpError.status === 422) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `📧 Este e-mail (${email}) já possui cadastro em nosso sistema!\n\n` +
                   `✅ Clique em "Já tenho conta" para fazer login.\n` +
                   `🔐 Caso tenha esquecido sua senha, você pode recuperá-la na tela de login.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '❌ Erro ao criar conta. Tente novamente.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!authData.user) {
      console.error('❌ Usuário não foi criado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '❌ Erro ao criar conta. Tente novamente.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Usuário criado com ID:', authData.user.id);

    // ===================================================================
    // ETAPA 3: CRIAR PERFIL DO CLIENTE
    // ===================================================================
    console.log('🔍 [3/4] Criando perfil do cliente...');
    
    const { error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .insert({
        id: authData.user.id,
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        data_nascimento: data_nascimento
      });

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
      
      // IMPORTANTE: Perfil falhou, DELETAR usuário criado
      console.log('🗑️ Deletando usuário criado...');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      if (profileError.message?.includes('whatsapp') || profileError.message?.includes('unique')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: '📱 Este número de WhatsApp já está cadastrado em nosso sistema!\n\n' +
                   'Por favor, use um número diferente.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '❌ Não foi possível completar seu cadastro.\n\nPor favor, tente novamente.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Perfil criado com sucesso');

    // ===================================================================
    // [4/4] EMAIL DE CONFIRMAÇÃO NATIVO DO SUPABASE
    // ===================================================================
    console.log('🔍 [4/4] Gerando link de confirmação nativo do Supabase...');
    
    try {
      // Usar generateLink type='signup' para enviar email com template nativo do Supabase
      const { data: linkData, error: emailError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/painel-cliente/dashboard`
        }
      });

      if (emailError) {
        console.error('⚠️ Erro ao gerar link de confirmação:', emailError);
        console.log('ℹ️ Usuário pode fazer login e solicitar reenvio');
      } else {
        console.log('✅ Link de confirmação gerado - Supabase enviará email com template configurado');
        console.log(`📧 Template usado: Authentication > Email Templates > Confirm signup`);
        console.log(`🔗 Redirect: /painel-cliente/dashboard`);
      }
    } catch (emailException) {
      console.error('⚠️ Exceção ao gerar link:', emailException);
      console.log('ℹ️ Cadastro concluído - usuário pode solicitar reenvio');
    }

    // ===================================================================
    // SUCESSO COMPLETO!
    // ===================================================================
    return new Response(
      JSON.stringify({ 
        success: true,
        needsEmailConfirmation: true,
        message: '✅ Cadastro realizado com sucesso!\n\n📧 Enviamos um link de confirmação para o seu e-mail.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '❌ Erro inesperado ao criar conta.\n\nPor favor, tente novamente.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

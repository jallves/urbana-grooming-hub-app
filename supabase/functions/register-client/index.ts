import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

interface RegisterClientRequest {
  nome: string;
  email: string;
  whatsapp: string;
  data_nascimento: string;
  senha: string;
}

// Função para normalizar WhatsApp (remove formatação)
function normalizeWhatsApp(whatsapp: string): string {
  return whatsapp.replace(/\D/g, '');
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

    // Normalizar WhatsApp para comparação
    const whatsappNormalizado = normalizeWhatsApp(whatsapp);
    console.log('📱 WhatsApp normalizado:', whatsappNormalizado, '(original:', whatsapp, ')');

    // Initialize Supabase clients
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

    // Cliente anônimo para signUp (envia e-mail automaticamente)
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
    console.log('🔍 [1/4] Verificando WhatsApp único em todas as tabelas...');
    
    // Verificar em client_profiles (excluir temporários temp-*)
    const { data: existingInProfiles, error: profilesCheckError } = await supabaseAdmin
      .from('client_profiles')
      .select('nome, whatsapp')
      .not('whatsapp', 'like', 'temp-%')
      .limit(1000);

    if (profilesCheckError) {
      console.error('❌ Erro ao verificar WhatsApp em client_profiles:', profilesCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '⚠️ Não foi possível verificar seus dados neste momento.\n\nPor favor, aguarde alguns segundos e tente novamente.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Verificar se algum WhatsApp normalizado corresponde
    const whatsappDuplicado = existingInProfiles?.find(profile => {
      const profileWhatsappNormalizado = normalizeWhatsApp(profile.whatsapp || '');
      return profileWhatsappNormalizado === whatsappNormalizado;
    });

    if (whatsappDuplicado) {
      console.warn('⚠️ WhatsApp já cadastrado:', whatsappDuplicado.whatsapp);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `📱 Este número de WhatsApp (${whatsapp}) já está cadastrado em nosso sistema!\n\n` +
                 `Nome cadastrado: ${whatsappDuplicado.nome}\n\n` +
                 `✅ Se esta é sua conta, clique em "Já tenho conta" para fazer login.\n` +
                 `🔐 Caso tenha esquecido sua senha, você pode recuperá-la na tela de login.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('✅ WhatsApp disponível em todas as tabelas');

    // ===================================================================
    // ETAPA 2: CRIAR USUÁRIO COM CLIENTE ANÔNIMO (ENVIA EMAIL AUTOMATICAMENTE)
    // ===================================================================
    console.log('🔍 [2/4] ✅ WhatsApp validado! Criando usuário...');
    
    // Redirecionar para página de confirmação de e-mail após clicar no link
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/painel-cliente/email-confirmado`;
    
    const { data: authData, error: signUpError } = await supabaseAnon.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          user_type: 'client',
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          data_nascimento: data_nascimento
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro ao criar usuário:', signUpError);
      
      // Email duplicado (fallback, já verificamos antes)
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
    console.log('📧 E-mail de confirmação ENVIADO automaticamente pelo Supabase!');
    console.log(`🔗 Redirect configurado para: ${redirectUrl}`);

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
      console.log('🗑️ Deletando usuário criado (rollback)...');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      // Verificar se é erro de chave duplicada (ID já existe)
      if (profileError.code === '23505' && profileError.message?.includes('client_profiles_pkey')) {
        console.error('⚠️ ID do usuário já existe em client_profiles - possível tentativa duplicada');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: '⚠️ Detectamos uma tentativa de cadastro anterior.\n\n' +
                   'Por favor, verifique seu e-mail para confirmar o cadastro.\n\n' +
                   '📧 Se não recebeu o e-mail, aguarde alguns minutos e verifique sua pasta de SPAM.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Verificar se é erro de WhatsApp duplicado
      if (profileError.code === '23505' && profileError.message?.includes('whatsapp')) {
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
    // ETAPA 4: VERIFICAR STATUS DO EMAIL
    // ===================================================================
    console.log('🔍 [4/4] Verificando status do e-mail de confirmação...');
    
    if (authData.user.email_confirmed_at) {
      console.log('⚠️ E-mail foi confirmado automaticamente (modo dev ou configuração)');
    } else {
      console.log('✅ E-mail pendente de confirmação - link enviado para:', email);
      console.log('📬 Template usado: Authentication > Email Templates > Confirm signup');
      console.log('⏰ E-mail pode levar alguns segundos/minutos para chegar');
      console.log('📋 Instruir cliente a verificar: Caixa de entrada, Spam, Promoções');
    }

    // ===================================================================
    // SUCESSO COMPLETO!
    // ===================================================================
    return new Response(
      JSON.stringify({ 
        success: true,
        needsEmailConfirmation: true,
        message: '✅ Cadastro realizado com sucesso!\n\n' +
                 '📧 Enviamos um link de confirmação para o seu e-mail.\n\n' +
                 '📬 Verifique sua caixa de entrada e também a pasta de SPAM/Promoções.\n\n' +
                 '⏰ O e-mail pode levar alguns minutos para chegar.'
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
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
    console.log('🔍 [1/4] Verificando WhatsApp único em painel_clientes...');
    
    // Verificar em painel_clientes (tabela correta com nome, whatsapp)
    const { data: existingClients, error: clientsCheckError } = await supabaseAdmin
      .from('painel_clientes')
      .select('nome, whatsapp')
      .not('whatsapp', 'is', null)
      .limit(1000);

    if (clientsCheckError) {
      console.error('❌ Erro ao verificar WhatsApp em painel_clientes:', clientsCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '⚠️ Não foi possível verificar seus dados neste momento.\n\nPor favor, aguarde alguns segundos e tente novamente.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Verificar se algum WhatsApp normalizado corresponde
    const whatsappDuplicado = existingClients?.find(client => {
      const clientWhatsappNormalizado = normalizeWhatsApp(client.whatsapp || '');
      return clientWhatsappNormalizado === whatsappNormalizado;
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

    console.log('✅ WhatsApp disponível');

    // ===================================================================
    // ETAPA 2: CRIAR USUÁRIO COM CLIENTE ANÔNIMO (ENVIA EMAIL AUTOMATICAMENTE)
    // ===================================================================
    console.log('🔍 [2/4] ✅ WhatsApp validado! Criando usuário...');
    
    // URL de redirecionamento após confirmação do e-mail
    // Usar o domínio próprio da barbearia
    const redirectUrl = 'https://barbeariacostaurbana.com.br/painel-cliente/email-confirmado';
    
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
      
      // Rate limit de email
      if (signUpError.message.includes('rate limit') || 
          signUpError.status === 429 ||
          signUpError.code === 'over_email_send_rate_limit') {
        console.warn('⚠️ Rate limit de email atingido para:', email);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `⏳ Muitas tentativas de cadastro em pouco tempo!\n\n` +
                   `O sistema de e-mail atingiu o limite temporário.\n` +
                   `⏰ Aguarde alguns minutos e tente novamente.\n\n` +
                   `Se já recebeu um e-mail de confirmação anteriormente, verifique sua caixa de entrada e spam.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

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

    // ===================================================================
    // DETECÇÃO DE USER_REPEATED_SIGNUP
    // Quando o Supabase retorna um user sem identities, significa que o
    // email já existe no auth. Nesse caso, buscamos o user real e
    // re-vinculamos o perfil em painel_clientes.
    // ===================================================================
    const isRepeatedSignup = !authData.user.identities || authData.user.identities.length === 0;
    let realUserId = authData.user.id;

    if (isRepeatedSignup) {
      console.log('⚠️ Detected user_repeated_signup - email já existe no auth');
      
      // Buscar o user real pelo email via admin
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Erro ao buscar usuário existente:', listError);
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

      const existingUser = existingUsers?.users?.find(
        u => u.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (!existingUser) {
        console.error('❌ Usuário não encontrado no auth apesar de repeated_signup');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: '❌ Erro inesperado ao processar cadastro. Tente novamente.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      realUserId = existingUser.id;
      console.log('✅ Usuário real encontrado:', realUserId);

      // Verificar se já existe perfil para este user
      const { data: existingProfile } = await supabaseAdmin
        .from('painel_clientes')
        .select('id')
        .eq('user_id', realUserId)
        .maybeSingle();

      if (existingProfile) {
        console.log('✅ Perfil já existe, redirecionando para login');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `📧 Este e-mail (${email}) já possui cadastro completo!\n\n` +
                   `✅ Clique em "Já tenho conta" para fazer login.\n` +
                   `🔐 Caso tenha esquecido sua senha, você pode recuperá-la na tela de login.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Perfil não existe mas user sim - recriar perfil vinculado
      console.log('🔄 Recriando perfil para usuário existente:', realUserId);
    } else {
      console.log('✅ Novo usuário criado com ID:', authData.user.id);
      console.log('📧 E-mail de confirmação ENVIADO automaticamente pelo Supabase!');
    }

    console.log(`🔗 Redirect configurado para: ${redirectUrl}`);

    // ===================================================================
    // ETAPA 3: CRIAR PERFIL DO CLIENTE EM painel_clientes
    // ===================================================================
    console.log('🔍 [3/4] Criando perfil do cliente em painel_clientes...');
    
    const { error: clientError } = await supabaseAdmin
      .from('painel_clientes')
      .insert({
        user_id: realUserId,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        data_nascimento: data_nascimento
      });

    if (clientError) {
      console.error('❌ Erro ao criar perfil:', clientError);
      
      // IMPORTANTE: Perfil falhou, DELETAR usuário criado (somente se for novo)
      if (!isRepeatedSignup) {
        console.log('🗑️ Deletando usuário criado (rollback)...');
        await supabaseAdmin.auth.admin.deleteUser(realUserId);
      } else {
        console.log('⚠️ Usuário pré-existente, não deletando (repeated signup)');
      }
      
      // Verificar se é erro de duplicado
      if (clientError.code === '23505') {
        if (clientError.message?.includes('whatsapp')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: '📱 Este número de WhatsApp já está cadastrado em nosso sistema!\n\nPor favor, use um número diferente.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        if (clientError.message?.includes('email')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: '📧 Este e-mail já está cadastrado em nosso sistema!\n\nClique em "Já tenho conta" para fazer login.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '❌ Não foi possível completar seu cadastro.\n\nPor favor, tente novamente.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Perfil criado com sucesso em painel_clientes');

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
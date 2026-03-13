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
    // ETAPA 1.5: VERIFICAR SE EMAIL PERTENCE A UM BARBEIRO/FUNCIONÁRIO
    // ===================================================================
    console.log('🔍 [1.5/4] Verificando se email pertence a barbeiro/funcionário...');
    
    const emailNormalizado = email.trim().toLowerCase();
    
    const { data: barberWithEmail } = await supabaseAdmin
      .from('painel_barbeiros')
      .select('nome')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (barberWithEmail) {
      console.warn('⚠️ Email pertence a um barbeiro:', barberWithEmail.nome);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `🚫 Este e-mail (${email}) já está cadastrado como barbeiro/funcionário.\n\n` +
                 `Por favor, utilize um e-mail pessoal diferente para criar sua conta de cliente.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: staffWithEmail } = await supabaseAdmin
      .from('staff')
      .select('name')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (staffWithEmail) {
      console.warn('⚠️ Email pertence a um staff:', staffWithEmail.name);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `🚫 Este e-mail (${email}) já está cadastrado como funcionário.\n\n` +
                 `Por favor, utilize um e-mail pessoal diferente para criar sua conta de cliente.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: employeeWithEmail } = await supabaseAdmin
      .from('employees')
      .select('name')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (employeeWithEmail) {
      console.warn('⚠️ Email pertence a um employee:', employeeWithEmail.name);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `🚫 Este e-mail (${email}) já está cadastrado como funcionário.\n\n` +
                 `Por favor, utilize um e-mail pessoal diferente para criar sua conta de cliente.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('✅ Email não pertence a barbeiro/funcionário');

    // ===================================================================
    // ETAPA 2: CRIAR USUÁRIO VIA ADMIN API (AUTO-CONFIRMADO, SEM EMAIL)
    // ===================================================================
    console.log('🔍 [2/4] ✅ WhatsApp validado! Criando usuário...');
    
    // Primeiro verificar se o email já existe no auth
    const { data: existingAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    const existingAuthUser = existingAuthUsers?.users?.find(
      u => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    let realUserId: string;
    let isRepeatedSignup = false;

    if (existingAuthUser) {
      console.log('⚠️ Email já existe no auth, verificando perfil...');
      isRepeatedSignup = true;
      realUserId = existingAuthUser.id;

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
      // Criar novo usuário via Admin API (auto-confirmado, sem enviar email)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: senha,
        email_confirm: true,
        user_metadata: {
          user_type: 'client',
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          data_nascimento: data_nascimento
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        
        if (createError.message?.includes('already') || createError.status === 422) {
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

      if (!newUser?.user) {
        console.error('❌ Usuário não foi criado');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: '❌ Erro ao criar conta. Tente novamente.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      realUserId = newUser.user.id;
      console.log('✅ Novo usuário criado (auto-confirmado) com ID:', realUserId);
    }

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
    // ETAPA 4: SUCESSO COMPLETO! (auto-confirmado, sem necessidade de email)
    // ===================================================================
    console.log('🔍 [4/4] ✅ Cadastro completo! Usuário auto-confirmado.');

    return new Response(
      JSON.stringify({ 
        success: true,
        needsEmailConfirmation: false,
        message: '✅ Cadastro realizado com sucesso!\n\nVocê já pode fazer login com seu e-mail e senha.'
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
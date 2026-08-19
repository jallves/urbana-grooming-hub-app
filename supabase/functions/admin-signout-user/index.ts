import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-totem-token',
}

interface SignOutRequest {
  userId: string;
  reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 [admin-signout-user] Iniciando processo de logout forçado...');

    // Verificar autenticação do admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ [admin-signout-user] Header de autorização ausente');
      return new Response(
        JSON.stringify({ error: 'Autorização necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com a chave anônima para verificar o admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar se o usuário que está fazendo a requisição é admin
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !adminUser) {
      console.error('❌ [admin-signout-user] Erro ao verificar usuário:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [admin-signout-user] Admin autenticado:', adminUser.email);

    // Verificar se o usuário é realmente admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .in('role', ['admin', 'master'])
      .maybeSingle();

    if (roleError || !userRole) {
      console.error('❌ [admin-signout-user] Usuário não é admin:', adminUser.email);
      return new Response(
        JSON.stringify({ error: 'Sem permissão de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [admin-signout-user] Permissão de admin confirmada:', userRole.role);

    // Obter dados da requisição
    const { userId, reason }: SignOutRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 [admin-signout-user] Alvo:', userId);
    console.log('📝 [admin-signout-user] Razão:', reason || 'Não especificada');

    // Criar cliente admin com SERVICE_ROLE_KEY
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('❌ [admin-signout-user] SERVICE_ROLE_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incorreta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔧 [admin-signout-user] Cliente admin criado com sucesso');

    // Derrubar todas as sessões do usuário usando auth.admin
    console.log('🚪 [admin-signout-user] Derrubando sessões via auth.admin.signOut...');
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId);

    if (signOutError) {
      console.error('❌ [admin-signout-user] Erro ao derrubar sessões:', signOutError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao derrubar sessões', 
          details: signOutError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [admin-signout-user] Sessões derrubadas via auth.admin');

    // Invalidar sessões na tabela user_sessions
    console.log('🗑️ [admin-signout-user] Invalidando sessões na tabela user_sessions...');
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .update({ 
        is_active: false,
        logout_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (sessionError) {
      console.warn('⚠️ [admin-signout-user] Erro ao invalidar user_sessions (não crítico):', sessionError);
    } else {
      console.log('✅ [admin-signout-user] Sessões invalidadas na tabela user_sessions');
    }

    // Buscar informações do usuário alvo para o log
    const { data: targetUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const targetUserEmail = targetUserData?.user?.email || 'Desconhecido';

    // Registrar ação no audit log
    console.log('📋 [admin-signout-user] Registrando no audit log...');
    const { error: auditError } = await supabaseAdmin
      .from('admin_activity_log')
      .insert({
        admin_id: adminUser.id,
        action: 'force_signout',
        entity: 'user',
        entity_id: userId,
        details: {
          target_user_email: targetUserEmail,
          reason: reason || 'Não especificada',
          performed_by: adminUser.email,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.warn('⚠️ [admin-signout-user] Erro ao registrar audit log (não crítico):', auditError);
    } else {
      console.log('✅ [admin-signout-user] Ação registrada no audit log');
    }

    console.log('🎉 [admin-signout-user] Processo concluído com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Todas as sessões do usuário foram derrubadas com sucesso',
        targetUser: targetUserEmail,
        performedBy: adminUser.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [admin-signout-user] Erro crítico:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

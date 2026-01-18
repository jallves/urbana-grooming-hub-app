import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

// Vincula um user autenticado a um registro existente em painel_clientes
// (caso o cliente já existisse no sistema via totem/admin, sem user_id).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Identificar usuário via JWT (Authorization header)
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '').trim();

    if (!jwt) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Sessão inválida' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const user = userData.user;
    const email = (user.email ?? '').trim().toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário sem e-mail' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1) Se já existe perfil com user_id, retornar
    const { data: existingByUserId, error: existingByUserIdErr } = await supabaseAdmin
      .from('painel_clientes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingByUserIdErr) {
      console.error('[link-client-profile] erro ao buscar por user_id:', existingByUserIdErr);
    }

    if (existingByUserId) {
      return new Response(JSON.stringify({ success: true, profile: existingByUserId, linked: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2) Buscar registro existente por e-mail (sem user_id) e vincular
    const { data: existingByEmail, error: existingByEmailErr } = await supabaseAdmin
      .from('painel_clientes')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingByEmailErr) {
      console.error('[link-client-profile] erro ao buscar por email:', existingByEmailErr);
      return new Response(JSON.stringify({ success: false, error: 'Erro ao localizar perfil' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!existingByEmail) {
      return new Response(JSON.stringify({ success: false, error: 'Perfil de cliente não encontrado para este e-mail' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Vincular apenas se estiver vazio (evita roubo de conta)
    if (existingByEmail.user_id && existingByEmail.user_id !== user.id) {
      return new Response(JSON.stringify({ success: false, error: 'Este perfil já está vinculado a outra conta' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('painel_clientes')
      .update({ user_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', existingByEmail.id)
      .select('*')
      .maybeSingle();

    if (updateErr) {
      console.error('[link-client-profile] erro ao vincular:', updateErr);
      return new Response(JSON.stringify({ success: false, error: 'Erro ao vincular perfil' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, profile: updated, linked: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('[link-client-profile] erro inesperado:', e);
    return new Response(JSON.stringify({ success: false, error: 'Erro inesperado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

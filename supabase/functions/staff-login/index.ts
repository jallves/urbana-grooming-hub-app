import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { matricula, email: requestedEmail, password } = await req.json();

    const code = matricula?.toString().trim() ?? '';
    const emailInput = requestedEmail?.toString().trim().toLowerCase() ?? '';

    if ((!code && !emailInput) || !password) {
      return json({ success: false, error: 'Identificação e senha são obrigatórias' }, 400);
    }

    if (code && emailInput) {
      return json({ success: false, error: 'Informe somente matrícula ou e-mail' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Resolve matrícula -> e-mail internamente. E-mail informado diretamente
    // só será aceito depois da validação server-side da role master.
    let email: string | null = emailInput || null;
    let active: boolean | null = null;
    let userType: 'admin' | 'barber' = 'admin';
    let name: string | null = null;

    const { data: emp } = code
      ? await admin
          .from('employees')
          .select('email, status, is_active, role, name')
          .eq('matricula', code)
          .maybeSingle()
      : { data: null };

    if (emp) {
      email = emp.email;
      name = emp.name;
      active = emp.status !== 'inactive' && emp.is_active !== false;
      userType = emp.role === 'barber' ? 'barber' : 'admin';
    } else {
      const { data: barber } = await admin
        .from('painel_barbeiros')
        .select('email, is_active, nome')
        .eq('matricula', code)
        .maybeSingle();
      if (barber) {
        email = barber.email;
        name = barber.nome;
        active = barber.is_active !== false;
        userType = 'barber';
      } else {
        const { data: au } = await admin
          .from('admin_users')
          .select('email, is_active, name')
          .eq('matricula', code)
          .maybeSingle();
        if (au) {
          email = au.email;
          name = au.name;
          active = au.is_active !== false;
          userType = 'admin';
        }
      }
    }

    if (!email) {
      return json({ success: false, error: 'Acesso negado. Favor verificar usuário e senha.' }, 401);
    }

    if (active === false) {
      return json({ success: false, error: 'Seu acesso foi desativado. Contate o administrador.' }, 403);
    }

    // Autentica com a chave pública (valida a senha)
    const anon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signIn.session) {
      return json({ success: false, error: 'Acesso negado. Favor verificar usuário e senha.' }, 401);
    }

    const signedInUser = signIn.user;
    if (!signedInUser) {
      return json({ success: false, error: 'Acesso negado. Favor verificar usuário e senha.' }, 401);
    }

    // Regra definitiva: master somente por e-mail; todos os demais somente por matrícula.
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', signedInUser.id);

    const isMaster = (roles || []).some((r: { role: string }) => r.role === 'master');

    if (code && isMaster) {
      return json(
        { success: false, error: 'Acesso negado. Favor verificar usuário e senha.' },
        403
      );
    }

    if (emailInput && !isMaster) {
      return json(
        { success: false, error: 'Acesso negado. Favor verificar usuário e senha.' },
        403
      );
    }

    return json({
      success: true,
      session: signIn.session,
      user_id: signedInUser.id,
      user_type: userType,
      name,
    });
  } catch (e) {
    console.error('[staff-login] erro inesperado');
    return json({ success: false, error: 'Erro inesperado ao autenticar' }, 500);
  }
});

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
    const { matricula, password } = await req.json();

    if (!matricula?.toString().trim() || !password) {
      return json({ success: false, error: 'Matrícula e senha são obrigatórias' }, 400);
    }

    const code = matricula.toString().trim();

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Resolve matrícula -> e-mail (nunca exposto ao cliente)
    let email: string | null = null;
    let active: boolean | null = null;
    let userType: 'admin' | 'barber' = 'admin';
    let name: string | null = null;

    const { data: emp } = await admin
      .from('employees')
      .select('email, status, is_active, role, name')
      .eq('matricula', code)
      .maybeSingle();

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
      return json({ success: false, error: 'Matrícula ou senha incorretos' }, 401);
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
      return json({ success: false, error: 'Matrícula ou senha incorretos' }, 401);
    }

    // Master só acessa por e-mail
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', signIn.user!.id);

    if ((roles || []).some((r: any) => r.role === 'master')) {
      return json(
        { success: false, error: 'O administrador master deve acessar utilizando o e-mail.' },
        403
      );
    }

    return json({
      success: true,
      session: signIn.session,
      user_id: signIn.user!.id,
      user_type: userType,
      name,
    });
  } catch (e) {
    console.error('[staff-login] erro inesperado');
    return json({ success: false, error: 'Erro inesperado ao autenticar' }, 500);
  }
});

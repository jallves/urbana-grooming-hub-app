import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  endpoint: z.string().url().max(4096),
  p256dh: z.string().min(20).max(1024),
  auth: z.string().min(10).max(512),
  role: z.enum(['cliente', 'barbeiro', 'admin']),
  cliente_id: z.string().uuid().nullable().optional(),
  barbeiro_id: z.string().uuid().nullable().optional(),
  staff_id: z.string().uuid().nullable().optional(),
  user_agent: z.string().max(1024).nullable().optional(),
  active: z.boolean().optional(),
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, errorCode: 'method-not-allowed' }, 405);
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ success: false, errorCode: 'invalid-body', error: parsed.error.flatten().fieldErrors }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const authorization = req.headers.get('Authorization') || '';

    if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ success: false, errorCode: 'missing-auth' }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    const user = userData?.user;

    if (userError || !user?.id) {
      return jsonResponse({ success: false, errorCode: 'invalid-session' }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const body = parsed.data;
    const email = user.email?.trim().toLowerCase() || '';

    if (body.role === 'cliente') {
      if (!body.cliente_id) {
        return jsonResponse({ success: false, errorCode: 'missing-client-id' }, 400);
      }

      const { data: clientByUser } = await admin
        .from('painel_clientes')
        .select('id')
        .eq('id', body.cliente_id)
        .eq('user_id', user.id)
        .maybeSingle();

      let clientAllowed = Boolean(clientByUser?.id);
      if (!clientAllowed && email) {
        const { data: clientByEmail } = await admin
          .from('painel_clientes')
          .select('id')
          .eq('id', body.cliente_id)
          .ilike('email', email)
          .maybeSingle();
        clientAllowed = Boolean(clientByEmail?.id);
      }

      if (!clientAllowed) {
        return jsonResponse({ success: false, errorCode: 'client-not-authorized' }, 403);
      }
    }

    if (body.role === 'barbeiro') {
      if (!body.barbeiro_id || !email) {
        return jsonResponse({ success: false, errorCode: 'missing-barber-id' }, 400);
      }

      const { data: barber } = await admin
        .from('painel_barbeiros')
        .select('id, email, is_active')
        .eq('id', body.barbeiro_id)
        .maybeSingle();

      const barberEmail = String((barber as { email?: string } | null)?.email || '').trim().toLowerCase();
      const isInactive = (barber as { is_active?: boolean } | null)?.is_active === false;
      if (!barber?.id || barberEmail !== email || isInactive) {
        return jsonResponse({ success: false, errorCode: 'barber-not-authorized' }, 403);
      }
    }

    if (body.role === 'admin') {
      const { data: roleRows } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasAdminRole = (roleRows || []).some((row: { role?: string }) =>
        ['admin', 'master', 'manager'].includes(String(row.role)),
      );

      let hasAdminUser = false;
      if (!hasAdminRole && email) {
        const { data: adminUser } = await admin
          .from('admin_users')
          .select('id, is_active')
          .ilike('email', email)
          .maybeSingle();
        hasAdminUser = Boolean(adminUser?.id) && (adminUser as { is_active?: boolean }).is_active !== false;
      }

      if (!hasAdminRole && !hasAdminUser) {
        return jsonResponse({ success: false, errorCode: 'admin-not-authorized' }, 403);
      }
    }

    const { error: upsertError } = await admin
      .from('push_subscriptions')
      .upsert({
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        user_id: user.id,
        role: body.role,
        cliente_id: body.role === 'cliente' ? body.cliente_id || null : null,
        barbeiro_id: body.role === 'barbeiro' ? body.barbeiro_id || null : null,
        staff_id: body.role === 'barbeiro' ? body.staff_id || null : null,
        user_agent: body.user_agent || null,
        active: true,
        failure_count: 0,
      }, { onConflict: 'endpoint' });

    if (upsertError) {
      console.error('register-push-subscription upsert error', upsertError);
      return jsonResponse({ success: false, errorCode: 'db-error' }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('register-push-subscription error', error);
    return jsonResponse({ success: false, errorCode: 'unexpected-error' }, 500);
  }
});
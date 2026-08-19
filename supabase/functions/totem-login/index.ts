import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Verifies the totem PIN entirely server-side and issues a short-lived
// session token. The PIN hashes are no longer readable by the browser.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';

    if (!/^\d{4,10}$/.test(pin)) {
      return json({ success: false, error: 'PIN inválido' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // SHA-256 of the PIN, matching how the hashes were stored.
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(pin),
    );
    const pinHash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const { data: auth, error: authError } = await supabase
      .from('totem_auth')
      .select('id')
      .eq('pin_hash', pinHash)
      .eq('is_active', true)
      .maybeSingle();

    if (authError) {
      console.error('totem-login: erro ao consultar totem_auth', authError);
      return json({ success: false, error: 'Erro ao validar PIN' }, 500);
    }

    if (!auth) {
      return json({ success: false, error: 'PIN incorreto' }, 401);
    }

    // Issue a fresh 8h session token.
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const { data: session, error: sessionError } = await supabase
      .from('totem_sessions')
      .insert({
        totem_auth_id: auth.id,
        token,
        expires_at: expiresAt,
        is_valid: true,
      })
      .select('id, token, expires_at')
      .single();

    if (sessionError || !session) {
      console.error('totem-login: erro ao criar sessão', sessionError);
      return json({ success: false, error: 'Erro ao criar sessão' }, 500);
    }

    return json({
      success: true,
      totemAuthId: auth.id,
      sessionId: session.id,
      token: session.token,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('totem-login: erro inesperado', error);
    return json({ success: false, error: 'Erro inesperado' }, 500);
  }
});
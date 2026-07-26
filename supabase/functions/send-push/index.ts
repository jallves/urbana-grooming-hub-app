// Envia Web Push para inscrições filtradas por role/cliente/barbeiro.
// Chamado internamente por outras edge functions (não expor no client sem auth admin).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface Target {
  role?: 'cliente' | 'barbeiro' | 'admin';
  cliente_id?: string;
  barbeiro_id?: string;
  staff_id?: string;
  user_id?: string;
}

interface Payload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  icon?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

interface Body {
  target: Target;
  payload: Payload;
}

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:atendimento@barbeariacostaurbana.com.br';

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function normalizeVapidPublicKey(value: string): string {
  if (!value) return '';
  const decoded = decodeBase64Url(value.trim());
  if (decoded.length === 65 && decoded[0] === 4) return encodeBase64Url(decoded);

  // Compatibilidade com chave pública salva em DER/SPKI.
  if (decoded.length > 65) {
    const rawPoint = decoded.slice(decoded.length - 65);
    if (rawPoint.length === 65 && rawPoint[0] === 4) return encodeBase64Url(rawPoint);
  }

  return value;
}

function normalizeVapidPrivateKey(value: string): string {
  if (!value) return '';
  const decoded = decodeBase64Url(value.trim());
  if (decoded.length === 32) return encodeBase64Url(decoded);

  // Compatibilidade com chave privada salva em DER/PKCS8.
  for (let index = 0; index < decoded.length - 34; index += 1) {
    if (decoded[index] === 4 && decoded[index + 1] === 32) {
      return encodeBase64Url(decoded.slice(index + 2, index + 34));
    }
  }

  return value;
}

const normalizedVapidPublic = normalizeVapidPublicKey(VAPID_PUBLIC);
const normalizedVapidPrivate = normalizeVapidPrivateKey(VAPID_PRIVATE);

if (normalizedVapidPublic && normalizedVapidPrivate) {
  webpush.setVapidDetails(VAPID_SUBJECT, normalizedVapidPublic, normalizedVapidPrivate);
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { target, payload }: Body = await req.json();
    if (!target || !payload?.title) {
      return new Response(JSON.stringify({ error: 'target e payload.title obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Monta query filtrando inscrições ativas
    let query = supabase.from('push_subscriptions').select('*').eq('active', true);
    if (target.role) query = query.eq('role', target.role);
    if (target.cliente_id) query = query.eq('cliente_id', target.cliente_id);
    if (target.barbeiro_id) query = query.eq('barbeiro_id', target.barbeiro_id);
    if (target.staff_id) query = query.eq('staff_id', target.staff_id);
    if (target.user_id) query = query.eq('user_id', target.user_id);

    const { data: subs, error } = await query;
    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'Nenhuma inscrição encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notificationPayload = JSON.stringify(payload);
    const results = await Promise.allSettled(subs.map(async (s: any) => {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        await supabase.from('push_subscriptions').update({
          last_success_at: new Date().toISOString(), failure_count: 0,
        }).eq('id', s.id);
        return { id: s.id, ok: true };
      } catch (err: any) {
        const statusCode = err?.statusCode || 0;
        // 404/410 = subscription inválida, desativa
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').update({ active: false }).eq('id', s.id);
        } else {
          await supabase.from('push_subscriptions').update({
            failure_count: (s.failure_count || 0) + 1,
          }).eq('id', s.id);
        }
        return { id: s.id, ok: false, statusCode, error: err?.message };
      }
    }));

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).ok).length;
    return new Response(JSON.stringify({ sent, total: subs.length, results: results.map(r => r.status === 'fulfilled' ? r.value : { ok: false, error: String(r.reason) }) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-push error', err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
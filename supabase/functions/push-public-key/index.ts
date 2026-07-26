// Retorna a chave pública VAPID (é seguro expor — precisa ir para o browser)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

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
  try {
    const decoded = decodeBase64Url(value.trim());
    if (decoded.length === 65 && decoded[0] === 4) return encodeBase64Url(decoded);

    // Algumas chaves antigas foram salvas em DER/SPKI (começam com MFkw...).
    // O Web Push precisa apenas do ponto público P-256 não comprimido de 65 bytes.
    if (decoded.length > 65) {
      const rawPoint = decoded.slice(decoded.length - 65);
      if (rawPoint.length === 65 && rawPoint[0] === 4) return encodeBase64Url(rawPoint);
    }
  } catch (_) {
    return value;
  }

  return value;
}

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const publicKey = normalizeVapidPublicKey(Deno.env.get('VAPID_PUBLIC_KEY') || '');
  return new Response(JSON.stringify({ publicKey }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
/**
 * Dispara uma Edge Function usando fetch nativo (não depende do ciclo de vida do React).
 * Garante que a requisição seja enviada mesmo após navegação/unmount do componente.
 * Não espera resposta — é fire-and-forget real.
 */
export function fireAndForgetEdgeFunction(functionName: string, body: Record<string, any>) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[fireAndForget] Supabase URL ou key não configurados');
    return;
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`;

  // Tentar usar sendBeacon para garantir envio mesmo durante unload
  // sendBeacon tem limitações (só POST, sem headers customizados no body)
  // então usamos fetch com keepalive como fallback principal
  try {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify(body),
      keepalive: true, // Garante que a requisição sobrevive ao unload da página
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => 'no body');
        console.error(`[fireAndForget] ${functionName} falhou (${res.status}):`, text);
      } else {
        console.log(`✅ [fireAndForget] ${functionName} completou com sucesso`);
      }
    }).catch((err) => {
      console.error(`[fireAndForget] ${functionName} erro de rede:`, err);
    });
  } catch (err) {
    console.error(`[fireAndForget] ${functionName} erro ao disparar:`, err);
  }
}

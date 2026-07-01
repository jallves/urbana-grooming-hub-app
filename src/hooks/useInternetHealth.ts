import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Verificação discreta de conectividade real do tablet.
 *
 * - Escuta os eventos nativos `online`/`offline` do navegador.
 * - Faz um ping leve (imagem 204, no-cors) a cada `intervalMs` para detectar
 *   quando o Wi-Fi está "conectado" mas sem saída pra internet (captive portal,
 *   DNS caído, etc.) — cenário comum em totem.
 * - Não bloqueia nenhum fluxo por si só; apenas expõe `online` para a UI decidir.
 */
export function useInternetHealth(intervalMs: number = 20000) {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastCheckAt, setLastCheckAt] = useState<number>(Date.now());
  const abortRef = useRef<AbortController | null>(null);

  const ping = useCallback(async () => {
    // Se o próprio browser já sinaliza offline, nem tenta o fetch
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOnline(false);
      setLastCheckAt(Date.now());
      return;
    }

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 3500);

      // gstatic/generate_204 responde 204 rapidamente e é permitido em quase toda rede.
      // Cache-buster para evitar resposta do SW/PWA.
      await fetch(`https://www.gstatic.com/generate_204?_=${Date.now()}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setLastCheckAt(Date.now());
    }
  }, []);

  useEffect(() => {
    ping();
    const id = setInterval(ping, intervalMs);

    const handleOnline = () => {
      setOnline(true);
      ping();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(id);
      abortRef.current?.abort();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [ping, intervalMs]);

  return { online, lastCheckAt, recheck: ping };
}
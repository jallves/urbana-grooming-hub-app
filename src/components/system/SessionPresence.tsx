import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Garante que TODO usuário autenticado (admin, barbeiro ou cliente) apareça
 * como sessão ativa, mesmo quando a sessão do Supabase é restaurada sem passar
 * pelo formulário de login (PWA reaberto, refresh, nova aba).
 * O tipo de usuário é resolvido no servidor pela função register_presence().
 */
const SessionPresence = () => {
  const sessionId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) return;

      const deviceInfo = {
        platform: navigator.platform,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
      };

      const { data, error } = await supabase.rpc('register_presence', {
        p_user_agent: navigator.userAgent,
        p_device_info: deviceInfo as any,
      });

      if (!error && data) {
        sessionId.current = data as unknown as string;
      }
    };

    ping();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setTimeout(ping, 0);
      }
    });

    const interval = setInterval(ping, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  return null;
};

export default SessionPresence;

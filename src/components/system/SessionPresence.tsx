import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionManager } from '@/hooks/useSessionManager';

type UserType = 'admin' | 'barber' | 'painel_cliente';

const mapRole = (role: string | null): UserType | null => {
  if (!role) return null;
  if (role === 'master' || role === 'admin' || role === 'manager') return 'admin';
  if (role === 'barber') return 'barber';
  if (role === 'client') return 'painel_cliente';
  return null;
};

/**
 * Garante que TODO usuário autenticado apareça em active_sessions (online),
 * mesmo quando a sessão do Supabase é restaurada sem passar pelo formulário
 * de login (PWA reaberto, refresh, nova aba). Mantém heartbeat de atividade.
 */
const SessionPresence = () => {
  const { user, userRole } = useAuth();
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    const userType = mapRole(userRole);
    if (!user?.id || !userType) return;

    const key = `${user.id}:${userType}`;
    let cancelled = false;

    const run = async () => {
      await sessionManager.ensureSession({
        userId: user.id,
        userType,
        userEmail: user.email || undefined,
        userName:
          (user.user_metadata as any)?.name ||
          (user.user_metadata as any)?.full_name ||
          user.email?.split('@')[0] ||
          undefined,
      });
    };

    if (startedFor.current !== key) {
      startedFor.current = key;
      run();
    }

    // Heartbeat a cada 60s + ao voltar para o app
    const interval = setInterval(() => {
      if (!cancelled) sessionManager.updateActivity();
    }, 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) run();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [user?.id, user?.email, userRole]);

  return null;
};

export default SessionPresence;

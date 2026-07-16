import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Watch this user's active_sessions rows and force sign-out if an admin
 * invalidates them (is_active flipped to false or row deleted).
 */
export function useForceLogoutWatcher(
  userId: string | null | undefined,
  userType: 'admin' | 'barber' | 'client' | 'painel_cliente' | 'totem',
  redirectTo: string,
) {
  const triggered = useRef(false);

  useEffect(() => {
    if (!userId) return;
    triggered.current = false;

    const doLogout = async (reason: string) => {
      if (triggered.current) return;
      triggered.current = true;
      toast.error('Sessão encerrada pelo administrador', {
        description: reason,
        duration: 5000,
      });
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[ForceLogoutWatcher] signOut error', e);
      }
      // pequeno delay pro toast aparecer
      setTimeout(() => {
        try {
          localStorage.removeItem(`session_id_${userType}`);
          localStorage.removeItem(`session_data_${userType}`);
        } catch {}
        window.location.href = redirectTo;
      }, 800);
    };

    const channel = supabase
      .channel(`force-logout-${userType}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRow: any = payload.new;
          const oldRow: any = payload.old;
          if (
            newRow?.user_type === userType &&
            oldRow?.is_active === true &&
            newRow?.is_active === false
          ) {
            doLogout('Sua sessão foi encerrada remotamente.');
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldRow: any = payload.old;
          if (oldRow?.user_type === userType) {
            doLogout('Sua sessão foi removida.');
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userType, redirectTo]);
}
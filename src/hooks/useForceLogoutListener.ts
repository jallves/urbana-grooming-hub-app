import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para escutar notificações de logout forçado pelo admin
 * Simplificado - não usa tabela force_logout_notifications
 */
export function useForceLogoutListener(userId: string | undefined) {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    console.log('[useForceLogoutListener] 🔔 Listener ativo para user:', userId);

    // Listener simplificado - apenas monitora estado da autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log('[useForceLogoutListener] 🚪 Usuário deslogado');
        toast({
          title: "Sessão Encerrada",
          description: "Você foi desconectado.",
          variant: "destructive",
          duration: 5000,
        });
      }
    });

    return () => {
      console.log('[useForceLogoutListener] 🔕 Removendo listener');
      subscription.unsubscribe();
    };
  }, [userId, toast]);
}

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para escutar notificações de logout forçado pelo admin
 * Automaticamente desloga o usuário quando o admin encerra a sessão
 */
export function useForceLogoutListener(userId: string | undefined) {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    console.log('[useForceLogoutListener] 🔔 Iniciando listener para user:', userId);

    // Subscribe a notificações de logout forçado
    const channel = supabase
      .channel(`force-logout-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'force_logout_notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('[useForceLogoutListener] 🚨 Logout forçado recebido:', payload);
          
          const notification = payload.new as any;
          
          // Marcar notificação como processada
          try {
            await supabase.rpc('mark_logout_notification_processed', {
              p_notification_id: notification.id
            });
          } catch (error) {
            console.error('Erro ao marcar notificação:', error);
          }

          // Mostrar toast
          toast({
            title: "Sessão Encerrada",
            description: notification.reason || "Sua sessão foi encerrada por um administrador",
            variant: "destructive",
            duration: 5000,
          });

          // Aguardar um pouco e fazer logout
          setTimeout(async () => {
            console.log('[useForceLogoutListener] 🚪 Executando logout...');
            await supabase.auth.signOut();
            window.location.href = '/painel-cliente/login';
          }, 1500);
        }
      )
      .subscribe((status) => {
        console.log('[useForceLogoutListener] 📡 Status da subscription:', status);
      });

    return () => {
      console.log('[useForceLogoutListener] 🔕 Removendo listener');
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);
}

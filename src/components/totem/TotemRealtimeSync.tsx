import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TotemRealtimeSyncProps {
  sessionId?: string;
  onStatusUpdate?: (status: string) => void;
}

/**
 * Componente para sincronizar atualizações realtime do totem
 * Monitora mudanças na sessão e notifica o usuário
 */
export const TotemRealtimeSync: React.FC<TotemRealtimeSyncProps> = ({ 
  sessionId, 
  onStatusUpdate 
}) => {
  useEffect(() => {
    if (!sessionId) return;

    console.log('🔴 [Totem Realtime] Iniciando sync para sessão:', sessionId);

    const channel = supabase
      .channel(`totem-session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'totem_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('🔔 [Totem Realtime] Sessão atualizada:', payload);
          const newStatus = payload.new.status;
          
          if (newStatus === 'completed') {
            toast.success('Atendimento concluído!', {
              description: 'Obrigado pela visita!'
            });
          }
          
          if (onStatusUpdate) {
            onStatusUpdate(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔴 [Totem Realtime] Encerrando sync');
      supabase.removeChannel(channel);
    };
  }, [sessionId, onStatusUpdate]);

  return null;
};

export default TotemRealtimeSync;

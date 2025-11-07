import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealtimeContextType {
  refreshAppointments: () => void;
  refreshClients: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointmentCallbacks, setAppointmentCallbacks] = React.useState<Set<() => void>>(new Set());
  const [clientCallbacks, setClientCallbacks] = React.useState<Set<() => void>>(new Set());

  const refreshAppointments = useCallback(() => {
    appointmentCallbacks.forEach(cb => cb());
  }, [appointmentCallbacks]);

  const refreshClients = useCallback(() => {
    clientCallbacks.forEach(cb => cb());
  }, [clientCallbacks]);

  useEffect(() => {
    const channel = supabase
      .channel('global_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        (payload) => {
          refreshAppointments();
          
          if (payload.eventType === 'INSERT') {
            toast.success('Novo agendamento criado');
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const status = (payload.new as any)?.status;
            if (status === 'concluido') {
              toast.success('Agendamento finalizado');
            } else if (status === 'cancelado') {
              toast.info('Agendamento cancelado');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          refreshAppointments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_clientes'
        },
        () => {
          refreshClients();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients'
        },
        () => {
          refreshClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAppointments, refreshClients]);

  return (
    <RealtimeContext.Provider value={{ refreshAppointments, refreshClients }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

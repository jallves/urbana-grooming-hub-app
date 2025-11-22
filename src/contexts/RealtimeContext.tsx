import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealtimeContextType {
  refreshAppointments: () => void;
  refreshClients: () => void;
  refreshFinancials: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointmentCallbacks, setAppointmentCallbacks] = React.useState<Set<() => void>>(new Set());
  const [clientCallbacks, setClientCallbacks] = React.useState<Set<() => void>>(new Set());
  const [financialCallbacks, setFinancialCallbacks] = React.useState<Set<() => void>>(new Set());

  const refreshAppointments = useCallback(() => {
    appointmentCallbacks.forEach(cb => cb());
  }, [appointmentCallbacks]);

  const refreshClients = useCallback(() => {
    clientCallbacks.forEach(cb => cb());
  }, [clientCallbacks]);

  const refreshFinancials = useCallback(() => {
    financialCallbacks.forEach(cb => cb());
  }, [financialCallbacks]);

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_records'
        },
        (payload) => {
          refreshFinancials();
          
          if (payload.eventType === 'INSERT') {
            const record = payload.new as any;
            if (record.transaction_type === 'revenue') {
              toast.success('Nova receita registrada');
            } else if (record.transaction_type === 'expense') {
              toast.info('Nova despesa registrada');
            } else if (record.transaction_type === 'commission') {
              toast.info('Nova comissão registrada');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_flow'
        },
        () => {
          refreshFinancials();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barber_commissions'
        },
        () => {
          refreshFinancials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAppointments, refreshClients, refreshFinancials]);

  return (
    <RealtimeContext.Provider value={{ refreshAppointments, refreshClients, refreshFinancials }}>
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

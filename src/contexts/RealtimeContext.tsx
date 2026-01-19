import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealtimeContextType {
  refreshAppointments: () => void;
  refreshClients: () => void;
  refreshFinancials: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [appointmentCallbacks, setAppointmentCallbacks] = React.useState<Set<() => void>>(new Set());
  const [clientCallbacks, setClientCallbacks] = React.useState<Set<() => void>>(new Set());
  const [financialCallbacks, setFinancialCallbacks] = React.useState<Set<() => void>>(new Set());
  
  // Referência para evitar toasts duplicados
  const lastToastRef = useRef<{ message: string; time: number }>({ message: '', time: 0 });

  const showToast = useCallback((type: 'success' | 'info' | 'error', message: string) => {
    const now = Date.now();
    // Evita toast duplicado em menos de 2 segundos
    if (lastToastRef.current.message === message && now - lastToastRef.current.time < 2000) {
      return;
    }
    lastToastRef.current = { message, time: now };
    
    if (type === 'success') toast.success(message);
    else if (type === 'info') toast.info(message);
    else toast.error(message);
  }, []);

  // Função que invalida TODAS as queries financeiras do ERP
  const invalidateAllFinancialQueries = useCallback(() => {
    console.log('🔄 [Realtime] Invalidando todas as queries financeiras do ERP...');
    
    // Dashboard principal
    queryClient.invalidateQueries({ queryKey: ['financial-yearly-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['financial-dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['total-balance-erp'] });
    
    // Contas a Receber
    queryClient.invalidateQueries({ queryKey: ['contas-receber-erp'] });
    
    // Contas a Pagar
    queryClient.invalidateQueries({ queryKey: ['contas-pagar-erp'] });
    
    // Fluxo de Caixa
    queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    queryClient.invalidateQueries({ queryKey: ['daily-cash-flow'] });
    
    // Charts e relatórios
    queryClient.invalidateQueries({ queryKey: ['top-barbers-chart'] });
    queryClient.invalidateQueries({ queryKey: ['financial-evolution-chart'] });
    queryClient.invalidateQueries({ queryKey: ['pending-accounts-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['top-barbers-dashboard'] });
    
    // Comissões
    queryClient.invalidateQueries({ queryKey: ['barber-commissions'] });
    queryClient.invalidateQueries({ queryKey: ['commissions'] });
    
    // Vendas
    queryClient.invalidateQueries({ queryKey: ['vendas'] });
    
    // Executa callbacks adicionais registrados
    financialCallbacks.forEach(cb => cb());
  }, [queryClient, financialCallbacks]);

  const refreshAppointments = useCallback(() => {
    console.log('🔄 [Realtime] Atualizando agendamentos...');
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['painel-agendamentos'] });
    appointmentCallbacks.forEach(cb => cb());
  }, [queryClient, appointmentCallbacks]);

  const refreshClients = useCallback(() => {
    console.log('🔄 [Realtime] Atualizando clientes...');
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['painel-clientes'] });
    clientCallbacks.forEach(cb => cb());
  }, [queryClient, clientCallbacks]);

  const refreshFinancials = useCallback(() => {
    invalidateAllFinancialQueries();
  }, [invalidateAllFinancialQueries]);

  useEffect(() => {
    console.log('🔌 [Realtime] Iniciando listeners globais para ERP Financeiro...');
    
    const channel = supabase
      .channel('global_realtime_erp')
      // ========== AGENDAMENTOS ==========
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        (payload) => {
          console.log('📡 [Realtime] painel_agendamentos:', payload.eventType);
          refreshAppointments();
          
          if (payload.eventType === 'INSERT') {
            showToast('success', 'Novo agendamento criado');
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const status = (payload.new as any)?.status;
            if (status === 'concluido') {
              showToast('success', 'Agendamento finalizado');
              // Quando um agendamento é finalizado, atualiza também o financeiro
              invalidateAllFinancialQueries();
            } else if (status === 'cancelado') {
              showToast('info', 'Agendamento cancelado');
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
      // ========== CLIENTES ==========
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
      // ========== FINANCIAL RECORDS (Principal do ERP) ==========
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_records'
        },
        (payload) => {
          console.log('📡 [Realtime] financial_records:', payload.eventType);
          invalidateAllFinancialQueries();
          
          if (payload.eventType === 'INSERT') {
            const record = payload.new as any;
            if (record.transaction_type === 'revenue') {
              showToast('success', 'Nova receita registrada no ERP');
            } else if (record.transaction_type === 'expense') {
              showToast('info', 'Nova despesa registrada no ERP');
            } else if (record.transaction_type === 'commission') {
              showToast('info', 'Nova comissão registrada no ERP');
            }
          }
        }
      )
      // ========== CONTAS A RECEBER ==========
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_receber'
        },
        (payload) => {
          console.log('📡 [Realtime] contas_receber:', payload.eventType);
          invalidateAllFinancialQueries();
          
          if (payload.eventType === 'INSERT') {
            showToast('success', 'Nova conta a receber');
          } else if (payload.eventType === 'UPDATE') {
            const status = (payload.new as any)?.status;
            if (status === 'recebido') {
              showToast('success', 'Conta recebida!');
            }
          }
        }
      )
      // ========== CONTAS A PAGAR ==========
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_pagar'
        },
        (payload) => {
          console.log('📡 [Realtime] contas_pagar:', payload.eventType);
          invalidateAllFinancialQueries();
          
          if (payload.eventType === 'INSERT') {
            showToast('info', 'Nova conta a pagar');
          } else if (payload.eventType === 'UPDATE') {
            const status = (payload.new as any)?.status;
            if (status === 'pago') {
              showToast('success', 'Conta paga!');
            }
          }
        }
      )
      // ========== CASH FLOW ==========
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_flow'
        },
        (payload) => {
          console.log('📡 [Realtime] cash_flow:', payload.eventType);
          invalidateAllFinancialQueries();
        }
      )
      // ========== BARBER COMMISSIONS ==========
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barber_commissions'
        },
        (payload) => {
          console.log('📡 [Realtime] barber_commissions:', payload.eventType);
          invalidateAllFinancialQueries();
          
          if (payload.eventType === 'INSERT') {
            showToast('info', 'Nova comissão de barbeiro');
          } else if (payload.eventType === 'UPDATE') {
            const status = (payload.new as any)?.status;
            if (status === 'paid') {
              showToast('success', 'Comissão paga!');
            }
          }
        }
      )
      // ========== VENDAS ==========
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas'
        },
        (payload) => {
          console.log('📡 [Realtime] vendas:', payload.eventType);
          
          if (payload.eventType === 'UPDATE') {
            const status = (payload.new as any)?.status;
            if (status === 'PAGA' || status === 'pago') {
              console.log('💰 [Realtime] Venda finalizada! Atualizando ERP...');
              showToast('success', 'Venda finalizada com sucesso!');
              // Atualiza TUDO quando uma venda é finalizada
              invalidateAllFinancialQueries();
              refreshAppointments();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [Realtime] Status da conexão:', status);
      });

    return () => {
      console.log('🔌 [Realtime] Removendo channel global...');
      supabase.removeChannel(channel);
    };
  }, [refreshAppointments, refreshClients, invalidateAllFinancialQueries, showToast]);

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


import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppointmentSyncData {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  client_name?: string;
  barber_name?: string;
  service_name?: string;
  service_price?: number;
}

export const useAppointmentSync = (onUpdate?: () => void) => {
  // Função para sincronizar agendamento entre as tabelas
  const syncAppointmentToTables = useCallback(async (appointmentData: AppointmentSyncData, operation: 'insert' | 'update' | 'delete') => {
    try {
      const { id, cliente_id, barbeiro_id, servico_id, data, hora, status } = appointmentData;

      if (operation === 'insert' || operation === 'update') {
        // Buscar dados completos para sincronização
        const [clientData, barberData, serviceData] = await Promise.all([
          supabase.from('painel_clientes').select('*').eq('id', cliente_id).maybeSingle(),
          supabase.from('painel_barbeiros').select('*, staff_id').eq('id', barbeiro_id).maybeSingle(),
          supabase.from('painel_servicos').select('*').eq('id', servico_id).maybeSingle()
        ]);

        if (!clientData.data || !barberData.data || !serviceData.data) {
          console.error('Dados incompletos para sincronização');
          return;
        }

        // Criar data corretamente sem problemas de timezone
        const appointmentDate = new Date(data + 'T' + hora);
        const endTime = new Date(appointmentDate.getTime() + (serviceData.data.duracao * 60000));

        const appointmentStatus = status === 'cancelado' ? 'cancelled' : 
                                 status === 'confirmado' ? 'confirmed' : 
                                 status === 'concluido' ? 'completed' : 'scheduled';

        // Verificar se já existe na tabela appointments
        const { data: existingAppointment } = await supabase
          .from('appointments')
          .select('id')
          .eq('id', `painel_${id}`)
          .maybeSingle();

        const appointmentRecord = {
          id: `painel_${id}`,
          client_id: cliente_id,
          service_id: servico_id,
          staff_id: barberData.data.staff_id,
          start_time: appointmentDate.toISOString(),
          end_time: endTime.toISOString(),
          status: appointmentStatus,
          notes: null
        };

        if (existingAppointment) {
          // Atualizar registro existente
          await supabase
            .from('appointments')
            .update(appointmentRecord)
            .eq('id', `painel_${id}`);
        } else {
          // Inserir novo registro
          await supabase
            .from('appointments')
            .insert(appointmentRecord);
        }

        // Registrar no fluxo de caixa se concluído
        if (status === 'concluido' && operation === 'update') {
          // Verificar se já foi registrado no cash_flow
          const { data: existingCashFlow } = await supabase
            .from('cash_flow')
            .select('id')
            .eq('reference_id', id)
            .eq('reference_type', 'appointment')
            .maybeSingle();

          if (!existingCashFlow) {
            await supabase
              .from('cash_flow')
              .insert({
                transaction_type: 'income',
                amount: serviceData.data.preco,
                description: `Serviço: ${serviceData.data.nome} - Cliente: ${clientData.data.nome}`,
                category: 'Serviços',
                payment_method: 'Dinheiro',
                transaction_date: new Date().toISOString().split('T')[0],
                reference_id: id,
                reference_type: 'appointment'
              });
          }

          // Criar comissão para o barbeiro - só se não existir
          if (barberData.data.staff_id) {
            const { data: existingCommission } = await supabase
              .from('barber_commissions')
              .select('id')
              .eq('appointment_id', id)
              .maybeSingle();

            if (!existingCommission) {
              const { data: staffData } = await supabase
                .from('staff')
                .select('commission_rate')
                .eq('id', barberData.data.staff_id)
                .maybeSingle();

              const commissionRate = staffData?.commission_rate || 30;
              const commissionAmount = serviceData.data.preco * (commissionRate / 100);

              await supabase
                .from('barber_commissions')
                .insert({
                  barber_id: barberData.data.staff_id,
                  appointment_id: id,
                  amount: commissionAmount,
                  commission_rate: commissionRate,
                  status: 'pending'
                });
            }
          }
        }
      } else if (operation === 'delete') {
        // Remover da tabela appointments
        await supabase
          .from('appointments')
          .delete()
          .eq('id', `painel_${id}`);
      }

      console.log('Sincronização realizada com sucesso para:', id, 'status:', status);

    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }, []);

  // Configurar listeners em tempo real
  useEffect(() => {
    console.log('Configurando listeners de sincronização...');
    
    // Canal para mudanças na tabela painel_agendamentos
    const painelChannel = supabase
      .channel('painel_agendamentos_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        async (payload) => {
          console.log('Mudança detectada em painel_agendamentos:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as AppointmentSyncData;
            await syncAppointmentToTables(newData, payload.eventType.toLowerCase() as 'insert' | 'update');
          } else if (payload.eventType === 'DELETE') {
            const oldData = payload.old as AppointmentSyncData;
            await syncAppointmentToTables(oldData, 'delete');
          }

          // Notificar sobre a mudança
          if (onUpdate) {
            onUpdate();
          }

          // Toast para feedback do usuário - com verificação de tipo segura
          const newData = payload.new as AppointmentSyncData | null;
          const oldData = payload.old as AppointmentSyncData | null;
          const statusMessage = newData?.status || oldData?.status;
          
          if (statusMessage && typeof statusMessage === 'string') {
            const statusLabels: Record<string, string> = {
              confirmado: 'Confirmado',
              concluido: 'Concluído',
              cancelado: 'Cancelado',
              agendado: 'Agendado'
            };
            
            toast.success(`Agendamento ${statusLabels[statusMessage] || statusMessage}`, {
              description: 'Sincronizado em todos os painéis'
            });
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
        (payload) => {
          console.log('Mudança detectada em appointments:', payload);
          
          // Notificar sobre mudanças nos agendamentos regulares
          if (onUpdate) {
            onUpdate();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removendo listeners de sincronização...');
      supabase.removeChannel(painelChannel);
    };
  }, [syncAppointmentToTables, onUpdate]);

  return {
    syncAppointmentToTables
  };
};

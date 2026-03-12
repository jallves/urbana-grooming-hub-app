import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppointmentCompletion } from './hooks/useAppointmentCompletion';
import { sendAppointmentUpdateEmail } from '@/hooks/useSendAppointmentUpdateEmail';
import { sendAppointmentCancellationEmail } from '@/hooks/useSendAppointmentCancellationEmail';

export interface PainelAgendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  status_totem: string | null;
  created_at: string;
  updated_at: string;
  notas?: string | null;
  painel_clientes: {
    nome: string;
    email: string | null;
    whatsapp: string | null;
  } | null;
  painel_barbeiros: {
    nome: string;
    email: string | null;
    telefone: string | null;
    image_url: string | null;
    specialties: string[] | null;
    experience: string | null;
    commission_rate: number | null;
    is_active: boolean | null;
    role: string | null;
    staff_id: string | null;
  } | null;
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  } | null;
  appointment_totem_sessions?: Array<{
    totem_session_id: string | null;
    status: string | null;
    totem_sessions: {
      id: string;
      created_at: string | null;
    } | null;
  }>;
  vendas?: Array<{
    id: string;
    status: string | null;
  }>;
  // Legacy - mantido para compatibilidade
  totem_sessions?: Array<{
    check_in_time: string | null;
    check_out_time: string | null;
    status: string | null;
  }>;
}

export const useClientAppointments = () => {
  const [appointments, setAppointments] = useState<PainelAgendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { completing, completeAppointment } = useAppointmentCompletion();

  // Função para buscar agendamentos COM appointment_totem_sessions (crítico para status automático)
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [ADMIN] Buscando agendamentos com totem_sessions...');
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome, email, whatsapp),
          painel_barbeiros(nome, email, telefone, image_url, specialties, experience, commission_rate, is_active, role, staff_id),
          painel_servicos(nome, preco, duracao),
          vendas(id, status),
          appointment_totem_sessions(
            id,
            totem_session_id,
            status,
            created_at,
            totem_sessions(id, created_at, is_valid)
          )
        `)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;

      console.log(`✅ [ADMIN] ${data?.length || 0} agendamentos carregados`);
      
      // Normalizar relacionamentos que podem vir como objeto (1:1) ou array (1:N)
      const normalized = (data || []).map((a: any) => {
        const vendas = Array.isArray(a.vendas) ? a.vendas : a.vendas ? [a.vendas] : [];
        const appointment_totem_sessions = Array.isArray(a.appointment_totem_sessions)
          ? a.appointment_totem_sessions
          : a.appointment_totem_sessions
            ? [a.appointment_totem_sessions]
            : [];

        return {
          ...a,
          vendas,
          appointment_totem_sessions,
        };
      });
      
      // Log para debug de status
      normalized.slice(0, 3).forEach((a: any) => {
        const sessions = a.appointment_totem_sessions;
        console.log(
          `📋 [DEBUG] ${a.id}: status=${a.status}, sessions=${sessions?.length || 0}, venda_paga=${a.vendas?.some((v: any) => v.status === 'pago')}`
        );
      });

      setAppointments(normalized as unknown as PainelAgendamento[]);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Busca inicial dos agendamentos
  useEffect(() => {
    fetchAppointments();

    // ADICIONAR REALTIME LISTENERS ADMIN - DUPLO CANAL (agendamentos + vendas)
    console.log('🔴 [Admin Realtime] Configurando listeners globais para agendamentos E vendas');

    // Canal principal: escutar painel_agendamentos
    const appointmentsChannel = supabase
      .channel('admin-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        (payload) => {
          console.log('🔔 [Admin Realtime] Novo agendamento:', payload);
          toast.info('Novo agendamento criado!', {
            description: 'Lista atualizada automaticamente'
          });
          fetchAppointments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        (payload) => {
          console.log('🔔 [ADMIN REALTIME] Agendamento atualizado:', payload);
          console.log('📝 [ADMIN REALTIME] ID:', (payload.new as any).id);
          console.log('📝 [ADMIN REALTIME] Novo status:', (payload.new as any)?.status);
          console.log('📝 [ADMIN REALTIME] Status anterior:', (payload.old as any)?.status);
          console.log('📝 [ADMIN REALTIME] Novo status_totem:', (payload.new as any)?.status_totem);
          console.log('📝 [ADMIN REALTIME] status_totem anterior:', (payload.old as any)?.status_totem);
          
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          const oldStatusTotem = (payload.old as any)?.status_totem;
          const newStatusTotem = (payload.new as any)?.status_totem;
          const appointmentId = (payload.new as any)?.id;
          
          // Detectar mudanças em status OU status_totem
          const statusChanged = oldStatus !== newStatus;
          const statusTotemChanged = oldStatusTotem !== newStatusTotem;
          
          if (statusChanged || statusTotemChanged) {
            console.log(`🔄 [ADMIN REALTIME] Mudança detectada - status: "${oldStatus}" -> "${newStatus}", status_totem: "${oldStatusTotem}" -> "${newStatusTotem}"`);
            
            // Atualizar estado local imediatamente (se o appointment estiver na lista)
            setAppointments(prev => {
              const updated = prev.map(a => 
                a.id === appointmentId 
                  ? { ...a, status: newStatus, status_totem: newStatusTotem, updated_at: (payload.new as any).updated_at }
                  : a
              );
              
              // Log se encontrou ou não o appointment
              const found = prev.some(a => a.id === appointmentId);
              console.log(`📋 [ADMIN REALTIME] Appointment ${found ? 'ENCONTRADO' : 'NÃO ENCONTRADO'} na lista atual`);
              
              return updated;
            });
            
            // Mostrar toast apropriado
            if (statusTotemChanged && newStatusTotem === 'CHEGOU') {
              toast.info('✅ Check-in realizado!', {
                description: 'Cliente chegou na barbearia'
              });
            } else if (statusChanged) {
              toast.info('Agendamento atualizado!', {
                description: `Status alterado para: ${newStatus}`
              });
            }
          }
          
          // Fazer refetch completo para garantir sincronização total
          console.log('🔄 [ADMIN REALTIME] Fazendo refetch completo...');
          fetchAppointments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'painel_agendamentos'
        },
        (payload) => {
          console.log('🔔 [Admin Realtime] Agendamento deletado:', payload);
          fetchAppointments();
        }
      )
      .subscribe((status) => {
        console.log('📡 [Admin Realtime] appointmentsChannel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Admin Realtime] Conectado e escutando painel_agendamentos');
        }
      });

    // Canal secundário: escutar vendas (status 'pago' indica checkout concluído)
    const salesChannel = supabase
      .channel('admin-sales-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vendas'
        },
        (payload) => {
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          const vendaId = (payload.new as any)?.id;
          
          console.log('💰 [ADMIN REALTIME] Venda atualizada:', { vendaId, oldStatus, newStatus });
          
          // Se o status da venda mudou para 'pago', significa que um checkout foi concluído
          if (newStatus === 'pago' && oldStatus !== 'pago') {
            console.log('✅ [ADMIN REALTIME] Venda PAGA - Atualizando lista de agendamentos');
            
            // Atualizar localmente os agendamentos vinculados a esta venda
            setAppointments(prev => {
              const updated = prev.map(a => {
                // Se a venda deste agendamento foi paga, atualizar status
                const hasThisVenda = a.vendas?.some(v => v.id === vendaId);
                if (hasThisVenda) {
                  console.log(`📋 [ADMIN REALTIME] Agendamento ${a.id} tem venda ${vendaId} - marcando como concluído`);
                  return { 
                    ...a, 
                    vendas: a.vendas?.map(v => v.id === vendaId ? { ...v, status: 'pago' } : v)
                  };
                }
                return a;
              });
              return updated;
            });
            
            toast.success('Checkout concluído!', {
              description: 'Pagamento confirmado no totem'
            });
            
            // Refetch completo para garantir sincronização
            fetchAppointments();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [Admin Realtime] salesChannel status:', status);
      });

    // Canal terciário: escutar appointment_totem_sessions (check-in/checkout em tempo real)
    const totemSessionsChannel = supabase
      .channel('admin-totem-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_totem_sessions'
        },
        (payload) => {
          const appointmentId = (payload.new as any)?.appointment_id;
          const sessionStatus = (payload.new as any)?.status;
          
          console.log('✅ [ADMIN REALTIME] Check-in detectado:', { appointmentId, sessionStatus });
          
          toast.info('Check-in realizado!', {
            description: 'Cliente chegou na barbearia'
          });
          
          // Refetch para atualizar status visual
          fetchAppointments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointment_totem_sessions'
        },
        (payload) => {
          const appointmentId = (payload.new as any)?.appointment_id;
          const oldSessionStatus = (payload.old as any)?.status;
          const newSessionStatus = (payload.new as any)?.status;
          
          console.log('🔄 [ADMIN REALTIME] Sessão totem atualizada:', { 
            appointmentId, 
            oldSessionStatus, 
            newSessionStatus 
          });
          
          // Detectar checkout
          if (newSessionStatus === 'completed' || newSessionStatus === 'checkout_completed') {
            console.log('🎉 [ADMIN REALTIME] Checkout detectado via totem_sessions');
            toast.success('Checkout finalizado!', {
              description: 'Atendimento concluído com sucesso'
            });
          }
          
          // Refetch para atualizar status visual
          fetchAppointments();
        }
      )
      .subscribe((status) => {
        console.log('📡 [Admin Realtime] totemSessionsChannel status:', status);
      });

    return () => {
      console.log('🔴 [Admin Realtime] Removendo listeners');
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(totemSessionsChannel);
    };
  }, [fetchAppointments]);

  // Atualiza status do agendamento (cancelar ou marcar como ausente)
  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      console.log('🔄 [ADMIN] Atualizando status:', { appointmentId, newStatus });
      
      // Validar se pode alterar status
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) {
        toast.error('Agendamento não encontrado');
        return;
      }

      // Usar appointment_totem_sessions (tabela correta) para verificar check-in/checkout
      const hasCheckIn = appointment.appointment_totem_sessions && 
        Array.isArray(appointment.appointment_totem_sessions) &&
        appointment.appointment_totem_sessions.length > 0;
      
      const hasCheckOut = hasCheckIn && 
        appointment.appointment_totem_sessions?.some((s: any) => 
          s.status === 'completed' || s.status === 'checkout_completed'
        );
      
      // Função auxiliar para normalizar vendas (pode ser objeto ou array)
      const normalizeVendas = (vendas: any): Array<{ id: string; status: string | null }> => {
        if (!vendas) return [];
        if (Array.isArray(vendas)) return vendas;
        return [vendas];
      };
      
      // Verificar venda paga também (normalizado para array)
      const vendasArray = normalizeVendas(appointment.vendas);
      const hasPaidSale = vendasArray.some((v: any) => v.status === 'pago');
      
      // Determinar status atual baseado na mesma lógica do getActualStatus
      let currentStatus: string;
      
      // Prioridade 1: Status finais do banco
      const statusLower = appointment.status?.toLowerCase() || '';
      if (statusLower === 'concluido' || statusLower === 'ausente' || statusLower === 'cancelado') {
        currentStatus = statusLower;
      }
      // Prioridade 2: Venda paga
      else if (hasPaidSale) {
        currentStatus = 'concluido';
      }
      // Prioridade 3: Check-in/checkout
      else if (!hasCheckIn) {
        currentStatus = 'agendado';
      } else if (hasCheckIn && !hasCheckOut) {
        currentStatus = 'check_in_finalizado';
      } else {
        currentStatus = 'concluido';
      }
      
      console.log('📊 [ADMIN] Status atual calculado:', { 
        appointmentId, 
        currentStatus, 
        hasCheckIn, 
        hasCheckOut, 
        hasPaidSale,
        dbStatus: appointment.status 
      });

      // *** CONCLUIR USANDO EDGE FUNCTION ***
      if (newStatus === 'concluido') {
        console.log('🎯 [ADMIN] Finalizando agendamento via edge function:', appointmentId);
        
        const success = await completeAppointment(appointmentId);
        
        if (success) {
          // Atualiza localmente
          setAppointments(prev =>
            prev.map(a =>
              a.id === appointmentId ? { ...a, status: 'concluido' } : a
            )
          );
          await fetchAppointments(); // Refetch para garantir sincronização
        }
        return;
      }

      // Validações específicas por ação
      if (newStatus === 'cancelado') {
        // Validar se pode cancelar (apenas agendado e check_in_finalizado)
        if (currentStatus !== 'agendado' && currentStatus !== 'check_in_finalizado') {
          toast.error('Não é possível cancelar', {
            description: 'Apenas agendamentos com status "Agendado" ou "Check-in Finalizado" podem ser cancelados'
          });
          return;
        }
      }

      if (newStatus === 'ausente') {
        // Validar se pode marcar como ausente (apenas agendado ou check_in_finalizado)
        if (currentStatus !== 'agendado' && currentStatus !== 'check_in_finalizado') {
          toast.error('Não é possível marcar como ausente', {
            description: 'Apenas agendamentos com status "Agendado" ou "Check-in Finalizado" podem ser marcados como ausente'
          });
          return;
        }
      }

      // Atualizar status (para outros status que não 'concluido')
      console.log(`📝 [ADMIN] Atualizando painel_agendamentos para ${newStatus}:`, appointmentId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error(`❌ [ADMIN] Erro ao alterar para ${newStatus}:`, error);
        throw error;
      }
      
      console.log(`✅ [ADMIN] Agendamento alterado para ${newStatus}:`, data);

      // Registrar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activity_log').insert({
          admin_id: user.id,
          action: newStatus === 'cancelado' ? 'cancel_appointment' : 'mark_absent_appointment',
          entity: 'painel_agendamentos',
          entity_id: appointmentId,
          details: {
            previous_status: currentStatus,
            new_status: newStatus,
            client_name: appointment.painel_clientes?.nome
          }
        });
      }

      // Enviar e-mail de cancelamento se for cancelamento
      if (newStatus === 'cancelado') {
        console.log('📧 [Admin] Enviando e-mail de cancelamento...');
        try {
          await sendAppointmentCancellationEmail({
            appointmentId,
            cancelledBy: 'admin'
          });
        } catch (emailError) {
          console.error('⚠️ [Admin] Erro ao enviar e-mail de cancelamento:', emailError);
        }
      }

      const successMessage = newStatus === 'cancelado' 
        ? 'Agendamento cancelado com sucesso'
        : newStatus === 'ausente'
        ? 'Cliente marcado como ausente'
        : `Status alterado para ${newStatus}`;
        
      toast.success(successMessage);
      
      // Atualiza localmente
      setAppointments(prev =>
        prev.map(a =>
          a.id === appointmentId ? { ...a, status: newStatus } : a
        )
      );
      
    } catch (error: any) {
      console.error(`Erro ao alterar status do agendamento:`, error);
      toast.error('Erro ao alterar status do agendamento', {
        description: error.message || 'Tente novamente'
      });
    }
  }, [appointments, completeAppointment, fetchAppointments]);

  // Deleta agendamento
  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      console.log('🗑️ Tentando excluir agendamento:', appointmentId);

      // Buscar agendamento completo com validações
      const { data: appointment, error: fetchError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome),
          vendas(id, status)
        `)
        .eq('id', appointmentId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!appointment) {
        toast.error('Agendamento não encontrado');
        return false;
      }

      // Buscar sessão do totem separadamente (não há FK no PostgREST entre painel_agendamentos e appointment_totem_sessions)
      const { data: totemSessions, error: totemError } = await supabase
        .from('appointment_totem_sessions')
        .select('id')
        .eq('appointment_id', appointmentId)
        .limit(1);

      if (totemError) throw totemError;

      // Validações de integridade (com log detalhado)
      console.log('📋 Validando exclusão de agendamento:', {
        id: appointmentId,
        status: appointment.status,
        vendas: (appointment as any).vendas,
        totemSessionsCount: totemSessions?.length || 0
      });

      // Verificar se tem sessão de totem (check-in feito)
      const hasCheckIn = Array.isArray(totemSessions) && totemSessions.length > 0;
      const hasSales = Array.isArray((appointment as any).vendas) && (appointment as any).vendas.length > 0;
      const statusUpper = appointment.status?.toUpperCase() || '';
      const isFinalized = statusUpper === 'FINALIZADO' || statusUpper === 'CONCLUIDO';
      const isCancelled = statusUpper === 'CANCELADO';

      // Lei Pétrea: só pode excluir se não tiver NENHUMA informação
      if (hasCheckIn) {
        console.error('❌ BLOQUEIO: Agendamento possui check-in', {
          appointmentId,
          totemSessionsCount: totemSessions?.length || 0
        });
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento com check-in realizado'
        });
        return false;
      }

      if (hasSales) {
        console.error('❌ BLOQUEIO: Agendamento possui vendas associadas', {
          appointmentId,
          vendas: (appointment as any).vendas
        });
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento com vendas associadas'
        });
        return false;
      }

      if (isFinalized) {
        console.error('❌ BLOQUEIO: Agendamento está finalizado/concluído', {
          appointmentId,
          status: appointment.status,
          statusUpper
        });
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento finalizado ou concluído'
        });
        return false;
      }

      if (isCancelled) {
        console.error('❌ BLOQUEIO: Agendamento está cancelado', {
          appointmentId,
          status: appointment.status,
          statusUpper
        });
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento cancelado. O status "cancelado" deve ser mantido para fins de auditoria.'
        });
        return false;
      }

      console.log('✅ Validações aprovadas, prosseguindo com exclusão');

      // Registrar auditoria antes de excluir
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activity_log').insert({
          admin_id: user.id,
          action: 'delete_appointment',
          entity: 'painel_agendamentos',
          entity_id: appointmentId,
          details: {
            client_name: appointment.painel_clientes?.nome,
            date: appointment.data,
            time: appointment.hora,
            status: appointment.status,
            reason: 'permanent_deletion'
          }
        });
      }

      // Proceder com a exclusão
      const { error } = await supabase
        .from('painel_agendamentos')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      console.log('✅ Agendamento excluído com sucesso');
      setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
      toast.success('Agendamento excluído', {
        description: 'O registro foi permanentemente removido do sistema'
      });
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento', {
        description: error.message
      });
      return false;
    }
  }, []);

  // Atualiza agendamento (data, hora, barbeiro, serviço)
  const handleUpdateAppointment = useCallback(async (appointmentId: string, data: any, previousData?: {
    date?: string;
    time?: string;
    staffName?: string;
    serviceName?: string;
  }) => {
    try {
      console.log('📝 [Update] Atualizando agendamento:', appointmentId, data);
      
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('❌ [Update] Erro ao atualizar:', error);
        throw error;
      }

      console.log('✅ [Update] Agendamento atualizado com sucesso');
      
      // Determinar tipo de alteração
      let updateType: 'reschedule' | 'change_barber' | 'change_service' | 'general' = 'general';
      if (previousData?.date !== data.data || previousData?.time !== data.hora?.substring(0,5)) {
        updateType = 'reschedule';
      } else if (previousData?.staffName && data.barbeiro_id) {
        updateType = 'change_barber';
      } else if (previousData?.serviceName && data.servico_id) {
        updateType = 'change_service';
      }

      // Enviar e-mail de atualização
      console.log('📧 [Update] Enviando e-mail de atualização...');
      try {
        await sendAppointmentUpdateEmail({
          appointmentId,
          previousData,
          updateType,
          updatedBy: 'admin'
        });
      } catch (emailError) {
        console.error('⚠️ [Update] Erro ao enviar e-mail (não crítico):', emailError);
      }
      
      // Atualiza lista após edição
      await fetchAppointments();
      
      toast.success('✅ Agendamento atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
      return false;
    }
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading: isLoading || completing,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment,
    handleUpdateAppointment,
  };
};

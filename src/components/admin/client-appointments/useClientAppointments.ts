import { useState, useEffect, useCallback } from 'react';
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
  totem_sessions?: Array<{
    check_in_time: string | null;
    check_out_time: string | null;
    status: string | null;
  }>;
  vendas?: Array<{
    id: string;
    status: string | null;
  }>;
}

export const useClientAppointments = () => {
  const [appointments, setAppointments] = useState<PainelAgendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { completing, completeAppointment } = useAppointmentCompletion();

  // Função para buscar agendamentos
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome, email, whatsapp),
          painel_barbeiros(nome, email, telefone, image_url, specialties, experience, commission_rate, is_active, role, staff_id),
          painel_servicos(nome, preco, duracao),
          vendas(id, status)
        `)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;

      setAppointments((data || []) as unknown as PainelAgendamento[]);
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

    // ADICIONAR REALTIME LISTENERS ADMIN
    console.log('🔴 [Admin Realtime] Configurando listeners globais');

    const channel = supabase
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
          
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          const appointmentId = (payload.new as any)?.id;
          
          if (oldStatus !== newStatus) {
            console.log(`🔄 [ADMIN REALTIME] Status mudou de "${oldStatus}" para "${newStatus}"`);
            
            // Atualizar estado local imediatamente (se o appointment estiver na lista)
            setAppointments(prev => {
              const updated = prev.map(a => 
                a.id === appointmentId 
                  ? { ...a, status: newStatus, updated_at: (payload.new as any).updated_at }
                  : a
              );
              
              // Log se encontrou ou não o appointment
              const found = prev.some(a => a.id === appointmentId);
              console.log(`📋 [ADMIN REALTIME] Appointment ${found ? 'ENCONTRADO' : 'NÃO ENCONTRADO'} na lista atual`);
              
              return updated;
            });
            
            toast.info('Agendamento atualizado!', {
              description: `Status alterado para: ${newStatus}`
            });
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
      .subscribe();

    return () => {
      console.log('🔴 [Admin Realtime] Removendo listeners');
      supabase.removeChannel(channel);
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

      const hasCheckIn = appointment.totem_sessions?.some((s: any) => s.check_in_time);
      const hasCheckOut = appointment.totem_sessions?.some((s: any) => s.check_out_time);
      
      // Determinar status atual
      let currentStatus: string;
      if (!hasCheckIn) {
        currentStatus = 'agendado';
      } else if (hasCheckIn && !hasCheckOut) {
        currentStatus = 'check_in_finalizado';
      } else {
        currentStatus = 'concluido';
      }

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
          totem_sessions(check_in_time, check_out_time, status),
          vendas(id, status)
        `)
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Validações de integridade (com log detalhado)
      console.log('📋 Validando exclusão de agendamento:', {
        id: appointmentId,
        status: appointment.status,
        vendas: appointment.vendas
      });

      const hasCheckIn = false; // totem_sessions relation removed
      const hasSales = Array.isArray(appointment.vendas) && appointment.vendas.length > 0;
      const statusUpper = appointment.status?.toUpperCase() || '';
      const isFinalized = statusUpper === 'FINALIZADO' || statusUpper === 'CONCLUIDO';
      const isCancelled = statusUpper === 'CANCELADO';

      // Lei Pétrea: só pode excluir se não tiver NENHUMA informação
      if (hasCheckIn) {
        console.error('❌ BLOQUEIO: Agendamento possui check-in', {
          appointmentId,
          totem_sessions: appointment.totem_sessions
        });
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento com check-in realizado'
        });
        return false;
      }

      if (hasSales) {
        console.error('❌ BLOQUEIO: Agendamento possui vendas associadas', {
          appointmentId,
          vendas: appointment.vendas
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

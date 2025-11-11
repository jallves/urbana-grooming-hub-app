
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  painel_clientes: {
    nome: string;
    email: string;
    whatsapp: string;
  };
  painel_barbeiros: {
    nome: string;
    email: string;
    telefone: string;
    image_url: string;
    specialties: string;
    experience: string;
    commission_rate: number;
    is_active: boolean;
    role: string;
    staff_id: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
  totem_sessions?: {
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
  }[];
  vendas?: {
    id: string;
    status: string;
  }[];
}

export const useClientAppointments = () => {
  const [appointments, setAppointments] = useState<PainelAgendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar agendamentos
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes!inner(nome, email, whatsapp),
          painel_barbeiros!inner(nome, email, telefone, image_url, specialties, experience, commission_rate, is_active, role, staff_id),
          painel_servicos!inner(nome, preco, duracao),
          totem_sessions(check_in_time, check_out_time, status),
          vendas(id, status)
        `)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
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
          console.log('🔔 [Admin Realtime] Agendamento atualizado:', payload);
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

  // Atualiza status de agendamento com feedback visual
  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      console.log('Atualizando status do agendamento:', appointmentId, 'para:', newStatus);
      
      // Se for FINALIZADO, chamar edge function para processar tudo
      if (newStatus === 'FINALIZADO') {
        console.log('🎯 Finalizando agendamento via edge function...');
        
        const { data, error } = await supabase.functions.invoke('process-appointment-completion', {
          body: {
            agendamento_id: appointmentId,
            source: 'admin',
            completed_by: (await supabase.auth.getUser()).data.user?.id
          }
        });

        if (error) throw error;

        console.log('✅ Agendamento finalizado:', data);
        toast.success('Atendimento finalizado!', {
          description: 'Comissão e lançamentos financeiros gerados automaticamente.'
        });
      } else {
        // Para outros status, apenas atualizar
        const { error } = await supabase
          .from('painel_agendamentos')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', appointmentId);

        if (error) throw error;

        // Feedback visual baseado no status
        const statusMessages = {
          'confirmado': 'Agendamento confirmado com sucesso!',
          'concluido': 'Agendamento marcado como concluído!',
          'cancelado': 'Agendamento cancelado!'
        };

        toast.success(statusMessages[newStatus as keyof typeof statusMessages] || 'Status atualizado!');
      }

      // Atualiza localmente para refletir mudanças imediatas
      setAppointments(prev =>
        prev.map(appointment =>
          appointment.id === appointmentId ? { ...appointment, status: newStatus } : appointment
        )
      );
      
    } catch (error: any) {
      console.error('Erro ao atualizar status do agendamento:', error);
      toast.error('Erro ao atualizar status', {
        description: error.message || 'Tente novamente'
      });
    }
  }, []);

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

      // Validações de integridade
      const hasCheckIn = appointment.totem_sessions?.some((s: any) => s.check_in_time);
      const hasSales = appointment.vendas?.length > 0;
      const isFinalized = appointment.status === 'FINALIZADO' || appointment.status === 'concluido';

      if (hasCheckIn) {
        console.error('❌ Tentativa de excluir agendamento com check-in');
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento com check-in realizado'
        });
        return false;
      }

      if (hasSales) {
        console.error('❌ Tentativa de excluir agendamento com vendas');
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento com vendas associadas'
        });
        return false;
      }

      if (isFinalized) {
        console.error('❌ Tentativa de excluir agendamento finalizado');
        toast.error('Operação bloqueada', {
          description: 'Não é possível excluir agendamento finalizado'
        });
        return false;
      }

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
  const handleUpdateAppointment = useCallback(async (appointmentId: string, data: any) => {
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
      
      // Atualiza lista após edição (o real-time também vai atualizar, mas fazemos aqui para feedback imediato)
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
    isLoading,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment,
    handleUpdateAppointment,
  };
};

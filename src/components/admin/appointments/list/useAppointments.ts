
import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { useAuth } from '@/contexts/AuthContext';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, isBarber } = useAuth();
  
  // Função estável para buscar agendamentos
  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching appointments. isAdmin:', isAdmin, 'isBarber:', isBarber);
      
      // Buscar agendamentos regulares
      let regularAppointments: Appointment[] = [];
      
      if (!isAdmin && isBarber && user) {
        // Buscar agendamentos para barbeiro específico
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (staffError) {
          console.error('Error fetching staff data:', staffError);
          toast.error("Não foi possível carregar os dados do profissional.");
          setIsLoading(false);
          return;
        }
        
        if (!staffData) {
          console.log('No staff record found for this user');
        } else {
          const { data, error } = await supabase
            .from('appointments')
            .select(`
              *,
              client:client_id(*),
              service:service_id(*),
              staff:staff_id(*)
            `)
            .eq('staff_id', staffData.id)
            .order('start_time', { ascending: true });
          
          if (error) {
            console.error('Error fetching staff appointments:', error);
            throw error;
          }
          
          regularAppointments = data || [];
        }
      } else {
      // Admin - carregar todos os agendamentos do painel
        const { data, error } = await supabase
          .from('painel_agendamentos')
          .select(`
            *,
            cliente:painel_clientes(*),
            servico:painel_servicos(*),
            barbeiro:painel_barbeiros(*)
          `)
          .order('data', { ascending: true });
        
        if (error) {
          console.error('Error fetching all appointments:', error);
          throw error;
        }
        
        // Converter formato
        regularAppointments = (data || []).map((appt: any) => {
          const startTime = new Date(`${appt.data}T${appt.hora}`);
          const endTime = new Date(startTime.getTime() + (appt.servico?.duracao || 60) * 60000);
          return {
            id: appt.id,
            client_id: appt.cliente_id,
            service_id: appt.servico_id,
            staff_id: appt.barbeiro?.staff_id || null,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: appt.status,
            notes: null,
            created_at: appt.created_at,
            updated_at: appt.updated_at,
            client: appt.cliente ? { id: appt.cliente.id, name: appt.cliente.nome, email: appt.cliente.email, phone: appt.cliente.whatsapp, whatsapp: appt.cliente.whatsapp } : undefined,
            service: appt.servico ? { id: appt.servico.id, name: appt.servico.nome, price: appt.servico.preco, duration: appt.servico.duracao, description: appt.servico.descricao } : undefined,
            staff: appt.barbeiro ? { id: appt.barbeiro.id, name: appt.barbeiro.nome, email: appt.barbeiro.email, phone: appt.barbeiro.telefone } : undefined
          };
        });
      }

      // Buscar agendamentos do painel do cliente (apenas para admins)
      let painelAppointments: Appointment[] = [];
      if (isAdmin) {
        const { data: painelData, error: painelError } = await supabase
          .from('painel_agendamentos')
          .select(`
            *,
            painel_clientes!inner(nome, email, whatsapp),
            painel_barbeiros!inner(nome, email, telefone),
            painel_servicos!inner(nome, preco, duracao)
          `)
          .order('data', { ascending: true });

        if (painelError) {
          console.error('Error fetching painel appointments:', painelError);
        } else {
          // Converter agendamentos do painel para o formato padrão
          painelAppointments = (painelData || []).map((painel: any) => {
            const startTime = new Date(`${painel.data}T${painel.hora}`);
            const endTime = new Date(startTime.getTime() + (painel.painel_servicos.duracao * 60000));

            return {
              id: `painel_${painel.id}`,
              client_id: painel.cliente_id,
              service_id: painel.servico_id,
              staff_id: painel.barbeiro_id,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              status: painel.status === 'cancelado' ? 'cancelled' : 
                      painel.status === 'confirmado' ? 'confirmed' : 
                      painel.status === 'concluido' ? 'completed' : 'scheduled',
              notes: null,
              created_at: painel.created_at,
              updated_at: painel.updated_at,
              coupon_code: null,
              discount_amount: null,
              client: {
                id: painel.cliente_id,
                name: painel.painel_clientes.nome,
                email: painel.painel_clientes.email,
                phone: painel.painel_clientes.whatsapp,
                whatsapp: painel.painel_clientes.whatsapp,
                birth_date: null,
                created_at: painel.created_at,
                updated_at: painel.updated_at,
                password_hash: null,
                email_verified: null,
                email_verification_token: null,
                email_verification_expires: null
              },
              service: {
                id: painel.servico_id,
                name: painel.painel_servicos.nome,
                price: painel.painel_servicos.preco,
                duration: painel.painel_servicos.duracao,
                description: null,
                is_active: true,
                created_at: painel.created_at,
                updated_at: painel.updated_at
              },
              staff: {
                id: painel.barbeiro_id,
                name: painel.painel_barbeiros.nome,
                email: painel.painel_barbeiros.email,
                phone: painel.painel_barbeiros.telefone,
                role: 'barber',
                is_active: true,
                specialties: null,
                experience: null,
                image_url: null,
                commission_rate: null,
                created_at: painel.created_at,
                updated_at: painel.updated_at
              }
            } as Appointment;
          });
        }
      }

      // Combinar e ordenar todos os agendamentos
      const allAppointments = [...regularAppointments, ...painelAppointments]
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      console.log('📊 [Admin] Agendamentos carregados:', {
        regular: regularAppointments.length,
        painel: painelAppointments.length,
        total: allAppointments.length,
        timestamp: new Date().toISOString()
      });
      
      setAppointments(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error("Não foi possível carregar os agendamentos.");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isBarber, user]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, fetchAppointments]);

  // Configurar listeners de real-time
  useEffect(() => {
    if (!user) return;

    console.log('🔴 [Real-time] Configurando listeners para agendamentos');

    // Canal para tabela appointments
    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('🔴 [Real-time] Mudança detectada em appointments:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    // Canal para tabela painel_agendamentos (apenas para admins)
    let painelChannel: any = null;
    if (isAdmin) {
      painelChannel = supabase
        .channel('painel-agendamentos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'painel_agendamentos'
          },
          (payload) => {
            console.log('🔴 [Real-time] Mudança detectada em painel_agendamentos:', payload);
            fetchAppointments();
          }
        )
        .subscribe();
    }

    return () => {
      console.log('🔴 [Real-time] Removendo listeners de agendamentos');
      supabase.removeChannel(appointmentsChannel);
      if (painelChannel) {
        supabase.removeChannel(painelChannel);
      }
    };
  }, [user, isAdmin, fetchAppointments]);

  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      console.log('🔄 [PAINEL ADMIN] Atualizando status do agendamento:', appointmentId, 'para:', newStatus);
      
      const isPainelAppointment = appointmentId.startsWith('painel_');
      
      if (isPainelAppointment) {
        const realId = appointmentId.replace('painel_', '');
        const painelStatus = newStatus === 'cancelled' ? 'cancelado' : 
                            newStatus === 'confirmed' ? 'confirmado' : 
                            newStatus === 'completed' ? 'concluido' : 
                            newStatus === 'scheduled' ? 'agendado' : 'confirmado';

        console.log('📝 [PAINEL ADMIN] Atualizando painel_agendamentos:', { 
          realId, 
          statusOriginal: newStatus, 
          statusConvertido: painelStatus 
        });

        const { data, error } = await supabase
          .from('painel_agendamentos')
          .update({ 
            status: painelStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', realId)
          .select()
          .single();

        if (error) {
          console.error('❌ [PAINEL ADMIN] Erro ao atualizar painel_agendamentos:', error);
          throw error;
        }

        console.log('✅ [PAINEL ADMIN] painel_agendamentos atualizado com sucesso:', {
          id: data.id,
          status: data.status,
          updated_at: data.updated_at
        });
      } else {
        console.log('📝 [PAINEL ADMIN] Atualizando appointments:', { appointmentId, status: newStatus });

        const { data, error } = await supabase
          .from('appointments')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', appointmentId)
          .select()
          .single();

        if (error) {
          console.error('❌ [PAINEL ADMIN] Erro ao atualizar appointments:', error);
          throw error;
        }

        console.log('✅ [PAINEL ADMIN] appointments atualizado com sucesso:', {
          id: data.id,
          status: data.status,
          updated_at: data.updated_at
        });
      }
      
      // Atualizar estado local
      setAppointments(prev => prev.map(appointment => 
        appointment.id === appointmentId ? { ...appointment, status: newStatus } : appointment
      ));

      // Feedback visual de sucesso
      const statusLabels: Record<string, string> = {
        confirmed: 'confirmado',
        completed: 'concluído',
        cancelled: 'cancelado',
        scheduled: 'agendado'
      };

      toast.success('✅ Status atualizado!', {
        description: `Agendamento marcado como ${statusLabels[newStatus] || newStatus}`,
      });

      // Recarregar lista após pequeno delay para garantir propagação
      setTimeout(() => {
        fetchAppointments();
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Erro fatal ao atualizar status:', error);
      toast.error("Erro ao atualizar status", {
        description: error.message || "Não foi possível atualizar o status do agendamento.",
      });
    }
  }, [fetchAppointments]);
  
  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      const isPainelAppointment = appointmentId.startsWith('painel_');

      if (isPainelAppointment) {
        const realId = appointmentId.replace('painel_', '');
        const { error } = await supabase
          .from('painel_agendamentos')
          .delete()
          .eq('id', realId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointmentId);

        if (error) throw error;
      }
      
      setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
      
      toast.success("Agendamento excluído", {
        description: "O agendamento foi excluído com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error("Erro", {
        description: "Não foi possível excluir o agendamento.",
      });
      return false;
    }
  }, []);

  return {
    appointments,
    isLoading,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment
  };
};

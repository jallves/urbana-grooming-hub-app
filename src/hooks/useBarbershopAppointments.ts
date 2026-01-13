import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NewAppointment, AppointmentFormData, Commission } from '@/types/barbershop';

interface Barber {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

export const useBarbershopAppointments = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<NewAppointment[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar agendamentos
  const fetchAppointments = useCallback(async (filters?: {
    client_id?: string;
    barber_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(id, name, email, phone),
          barber:staff(id, name, email, specialties),
          service:services(id, name, price, duration)
        `)
        .order('start_time', { ascending: false });

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.barber_id) {
        query = query.eq('staff_id', filters.barber_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('start_time', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('start_time', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAppointments((data || []) as any[]);
      return (data || []) as any[];
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Criar agendamento
  const createAppointment = useCallback(async (
    formData: AppointmentFormData,
    clientId: string
  ) => {
    setIsLoading(true);
    try {
      // Verificar disponibilidade usando check_barber_slot_availability
      const { data: isAvailable } = await supabase.rpc('check_barber_slot_availability', {
        p_barber_id: formData.barber_id,
        p_date: formData.scheduled_date,
        p_time: formData.scheduled_time,
        p_duration: 60
      });

      if (!isAvailable) {
        toast({
          title: "Horário indisponível",
          description: "Este horário não está mais disponível. Tente outro horário.",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          staff_id: formData.barber_id,
          service_id: formData.service_id,
          start_time: `${formData.scheduled_date}T${formData.scheduled_time}:00`,
          end_time: `${formData.scheduled_date}T${formData.scheduled_time}:00`,
          notes: formData.notes,
          status: 'scheduled'
        })
        .select(`
          *,
          client:clients(id, name, email, phone),
          barber:staff(id, name, email, specialties),
          service:services(id, name, price, duration)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Agendamento criado",
        description: "Seu agendamento foi criado com sucesso!",
      });

      await fetchAppointments();
      return data;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchAppointments]);

  // Concluir agendamento
  const completeAppointment = useCallback(async (appointmentId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId)
        .select(`
          *,
          client:clients(id, name, email, phone),
          barber:staff(id, name, email, specialties),
          service:services(id, name, price, duration)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Agendamento concluído",
        description: "O agendamento foi marcado como concluído.",
      });

      await fetchAppointments();
      return data;
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir o agendamento.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchAppointments]);

  // Cancelar agendamento
  const cancelAppointment = useCallback(async (appointmentId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .select(`
          *,
          client:clients(id, name, email, phone),
          barber:staff(id, name, email, specialties),
          service:services(id, name, price, duration)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });

      await fetchAppointments();
      return data;
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchAppointments]);

  // Buscar barbeiros usando painel_barbeiros
  const fetchBarbers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, email, is_active')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;

      const mappedBarbers: Barber[] = (data || []).map(b => ({
        id: b.id,
        name: b.nome,
        email: b.email || '',
        is_active: b.is_active ?? true
      }));

      setBarbers(mappedBarbers);
      return mappedBarbers;
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
      return [];
    }
  }, []);

  // Buscar comissões
  const fetchCommissions = useCallback(async (filters?: {
    barber_id?: string;
    status?: string;
  }) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('barber_commissions')
        .select(`
          *,
          appointment:appointments(
            id, start_time,
            client:clients(name),
            service:services(name, price)
          ),
          barber:painel_barbeiros(id, nome, email)
        `)
        .order('created_at', { ascending: false });

      if (filters?.barber_id) {
        query = query.eq('barber_id', filters.barber_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCommissions((data || []) as any[]);
      return (data || []) as any[];
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as comissões.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Pagar comissão
  const payCommission = useCallback(async (commissionId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('barber_commissions')
        .update({ 
          status: 'pago',
          payment_date: new Date().toISOString()
        })
        .eq('id', commissionId)
        .select(`
          *,
          appointment:appointments(
            id, start_time,
            client:clients(name),
            service:services(name, price)
          ),
          barber:painel_barbeiros(id, nome, email)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Comissão paga",
        description: "A comissão foi marcada como paga com sucesso.",
      });

      await fetchCommissions();
      return data;
    } catch (error) {
      console.error('Erro ao pagar comissão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível pagar a comissão.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchCommissions]);

  return {
    appointments,
    commissions,
    barbers,
    isLoading,
    fetchAppointments,
    createAppointment,
    completeAppointment,
    cancelAppointment,
    fetchBarbers,
    fetchCommissions,
    payCommission
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, parse } from 'date-fns';
import { toast } from 'sonner';

interface UseAppointmentsProps {
  date: Date;
  viewMode: 'day' | 'week';
}

// Função para formatar agendamentos do painel para o formato esperado
const formatPainelAppointments = (painelData: any[]): Appointment[] => {
  return painelData.map(appt => {
    // Combinar data e hora para criar start_time e end_time
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
      client: appt.cliente ? {
        id: appt.cliente.id,
        name: appt.cliente.nome,
        email: appt.cliente.email,
        phone: appt.cliente.whatsapp,
        whatsapp: appt.cliente.whatsapp
      } : undefined,
      service: appt.servico ? {
        id: appt.servico.id,
        name: appt.servico.nome,
        price: appt.servico.preco,
        duration: appt.servico.duracao,
        description: appt.servico.descricao
      } : undefined,
      staff: appt.barbeiro ? {
        id: appt.barbeiro.id,
        name: appt.barbeiro.nome,
        email: appt.barbeiro.email,
        phone: appt.barbeiro.telefone
      } : undefined
    };
  });
};

export const useAppointments = ({ date, viewMode }: UseAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;
        
      if (viewMode === 'day') {
        startDate = startOfDay(date);
        endDate = endOfDay(date);
      } else {
        startDate = startOfWeek(date, { weekStartsOn: 1 });
        endDate = endOfWeek(date, { weekStartsOn: 1 });
      }
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          cliente:painel_clientes(*),
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .gte('data', startDateStr)
        .lte('data', endDateStr)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });
      
      if (error) throw error;
      
      const formatted = formatPainelAppointments(data || []);
      setAppointments(formatted);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos', {
        description: 'Não foi possível carregar os agendamentos. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [date, viewMode]);

  return {
    appointments,
    isLoading,
    fetchAppointments
  };
};

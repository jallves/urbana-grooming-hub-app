
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardMetrics {
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  averageServiceValue: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
}

export const useBarberDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    averageServiceValue: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);

        // Buscar ID do barbeiro
        const { data: barberData } = await supabase
          .from('painel_barbeiros')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (!barberData?.id) {
          setLoading(false);
          return;
        }

        // Buscar todos os agendamentos do barbeiro
        const { data: appointments } = await supabase
          .from('painel_agendamentos')
          .select(`
            *,
            painel_servicos!inner(preco)
          `)
          .eq('barbeiro_id', barberData.id);

        if (appointments) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // Filtrar agendamentos do mês atual
          const monthlyAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.data);
            return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
          });

          const totalAppointments = monthlyAppointments.length;
          const completedAppointments = monthlyAppointments.filter(apt => apt.status === 'concluido').length;
          const cancelledAppointments = monthlyAppointments.filter(apt => apt.status === 'cancelado').length;
          
          // Agendamentos futuros
          const upcomingAppointments = monthlyAppointments.filter(apt => {
            const aptDateTime = new Date(`${apt.data}T${apt.hora}`);
            return aptDateTime > now && apt.status !== 'cancelado' && apt.status !== 'concluido';
          }).length;

          // Calcular receita total dos agendamentos concluídos
          const totalRevenue = monthlyAppointments
            .filter(apt => apt.status === 'concluido')
            .reduce((acc, apt) => acc + (apt.painel_servicos?.preco || 0), 0);

          const averageServiceValue = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

          setMetrics({
            totalAppointments,
            completedAppointments,
            totalRevenue,
            averageServiceValue,
            upcomingAppointments,
            cancelledAppointments
          });
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user?.email]);

  return { metrics, loading };
};

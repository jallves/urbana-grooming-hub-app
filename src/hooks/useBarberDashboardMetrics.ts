
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
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
}

export const useBarberDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    averageServiceValue: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);

        // Buscar ID do barbeiro usando staff com user_id (auth.uid())
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'barber')
          .maybeSingle();

        if (!staffData?.id) {
          setLoading(false);
          return;
        }

        // Buscar todos os agendamentos do barbeiro do mês atual
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

        const { data: appointments } = await supabase
          .from('painel_agendamentos')
          .select(`
            *,
            painel_servicos!inner(preco, nome)
          `)
          .eq('barbeiro_id', staffData.id)
          .gte('data', firstDayOfMonth)
          .lte('data', lastDayOfMonth);

        // Buscar comissões do barbeiro (serviços e produtos)
        const { data: commissions } = await supabase
          .from('barber_commissions')
          .select('*')
          .eq('barber_id', staffData.id);

        if (appointments) {
          const totalAppointments = appointments.length;
          const completedAppointments = appointments.filter(apt => apt.status === 'concluido').length;
          const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelado').length;
          
          // Agendamentos futuros
          const upcomingAppointments = appointments.filter(apt => {
            const aptDateTime = new Date(`${apt.data}T${apt.hora}`);
            return aptDateTime > now && apt.status !== 'cancelado' && apt.status !== 'concluido';
          }).length;

          // Calcular receita total dos agendamentos concluídos
          const totalRevenue = appointments
            .filter(apt => apt.status === 'concluido')
            .reduce((acc, apt) => acc + (apt.painel_servicos?.preco || 0), 0);

          const averageServiceValue = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

          // Calcular comissões
          const totalCommissions = commissions?.reduce((acc, comm) => acc + Number(comm.amount), 0) || 0;
          const pendingCommissions = commissions
            ?.filter(comm => comm.status === 'pending')
            .reduce((acc, comm) => acc + Number(comm.amount), 0) || 0;
          const paidCommissions = commissions
            ?.filter(comm => comm.status === 'paid')
            .reduce((acc, comm) => acc + Number(comm.amount), 0) || 0;

          setMetrics({
            totalAppointments,
            completedAppointments,
            totalRevenue,
            averageServiceValue,
            upcomingAppointments,
            cancelledAppointments,
            totalCommissions,
            pendingCommissions,
            paidCommissions
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

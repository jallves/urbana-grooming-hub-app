
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

export const useBarberDashboardMetrics = (selectedMonth?: number, selectedYear?: number) => {
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

        const { data: barberData } = await supabase
          .from('painel_barbeiros')
          .select('id, staff_id')
          .eq('email', user.email)
          .maybeSingle();

        if (!barberData?.id) {
          console.error('Barbeiro não encontrado para o usuário:', user.email);
          setLoading(false);
          return;
        }

        const barberId = barberData.id;

        const now = new Date();
        const month = selectedMonth ?? now.getMonth();
        const year = selectedYear ?? now.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const { data: appointments } = await supabase
          .from('painel_agendamentos')
          .select(`
            *,
            painel_servicos!inner(preco, nome)
          `)
          .eq('barbeiro_id', barberId)
          .gte('data', firstDayOfMonth)
          .lte('data', lastDayOfMonth);

        // Buscar comissões do mês selecionado
        const { data: commissions } = await supabase
          .from('barber_commissions')
          .select('*')
          .eq('barber_id', barberId)
          .gte('created_at', `${firstDayOfMonth}T00:00:00`)
          .lte('created_at', `${lastDayOfMonth}T23:59:59`);

        if (appointments) {
          const totalAppointments = appointments.length;
          const completedAppointments = appointments.filter(apt => apt.status === 'concluido').length;
          const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelado').length;
          
          const upcomingAppointments = appointments.filter(apt => {
            const aptDateTime = new Date(`${apt.data}T${apt.hora}`);
            return aptDateTime > now && apt.status !== 'cancelado' && apt.status !== 'concluido';
          }).length;

          const totalCommissions = commissions?.reduce((acc, comm) => acc + Number(comm.valor || comm.amount || 0), 0) || 0;
          const pendingCommissions = commissions
            ?.filter(comm => comm.status === 'pendente' || comm.status === 'pending')
            .reduce((acc, comm) => acc + Number(comm.valor || comm.amount || 0), 0) || 0;
          const paidCommissions = commissions
            ?.filter(comm => comm.status === 'pago' || comm.status === 'paid')
            .reduce((acc, comm) => acc + Number(comm.valor || comm.amount || 0), 0) || 0;

          // Receita bruta calculada a partir das comissões (mesma lógica da aba Comissões)
          const totalRevenue = commissions?.reduce((acc, comm) => {
            const commissionAmount = Number(comm.valor || comm.amount || 0);
            const rate = Number(comm.commission_rate || 0);
            const grossRevenue = rate > 0 ? (commissionAmount / (rate / 100)) : commissionAmount;
            return acc + grossRevenue;
          }, 0) || 0;

          const averageServiceValue = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

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
  }, [user?.email, selectedMonth, selectedYear]);

  return { metrics, loading };
};

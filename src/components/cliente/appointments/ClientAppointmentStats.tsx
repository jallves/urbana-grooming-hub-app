
import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClientAuth } from '@/contexts/ClientAuthContext';

interface ClientAppointmentStatsData {
  totalAppointments: number;
  upcomingAppointments: number;
  completedThisMonth: number;
  cancelledRate: number;
}

const ClientAppointmentStats = () => {
  const [stats, setStats] = useState<ClientAppointmentStatsData>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedThisMonth: 0,
    cancelledRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { client } = useClientAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!client) return;

      try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);

        // Get all client appointments
        const { data: allAppointments, error: allError } = await supabase
          .from('appointments')
          .select('status, start_time')
          .eq('client_id', client.id);

        if (allError) throw allError;

        const totalAppointments = allAppointments?.length || 0;
        
        // Get upcoming appointments
        const upcomingAppointments = allAppointments?.filter(apt => 
          new Date(apt.start_time) >= startOfToday && 
          apt.status === 'scheduled'
        ).length || 0;

        // Get completed appointments this month
        const completedThisMonth = allAppointments?.filter(apt => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= startOfCurrentMonth && 
                 aptDate <= endOfCurrentMonth && 
                 apt.status === 'completed';
        }).length || 0;

        // Calculate cancelled rate
        const cancelledAppointments = allAppointments?.filter(apt => apt.status === 'cancelled').length || 0;
        const cancelledRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0;

        setStats({
          totalAppointments,
          upcomingAppointments,
          completedThisMonth,
          cancelledRate,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [client]);

  const statCards = [
    {
      title: 'Total de Agendamentos',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'text-urbana-gold',
      bgColor: 'bg-urbana-gold/10',
      borderColor: 'border-urbana-gold/20',
    },
    {
      title: 'Próximos Agendamentos',
      value: stats.upcomingAppointments,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
    },
    {
      title: 'Concluídos Este Mês',
      value: stats.completedThisMonth,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
    },
    {
      title: 'Taxa de Cancelamento',
      value: `${stats.cancelledRate}%`,
      icon: TrendingUp,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={`hover:shadow-lg hover:shadow-urbana-gold/10 transition-all duration-300 bg-gray-800 border ${stat.borderColor} hover:border-urbana-gold/50`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1 font-raleway">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-white font-playfair">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor} border ${stat.borderColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClientAppointmentStats;

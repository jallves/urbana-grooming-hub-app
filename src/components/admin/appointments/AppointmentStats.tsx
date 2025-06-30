
import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentStatsData {
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  weeklyGrowth: number;
}

const AppointmentStats = () => {
  const [stats, setStats] = useState<AppointmentStatsData>({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0,
    weeklyGrowth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        // Get today's appointments
        const { data: todayAppointments, error: todayError } = await supabase
          .from('appointments')
          .select('status')
          .gte('start_time', startOfToday.toISOString())
          .lte('start_time', endOfToday.toISOString());

        if (todayError) throw todayError;

        const todayTotal = todayAppointments?.length || 0;
        const todayCompleted = todayAppointments?.filter(apt => apt.status === 'completed').length || 0;
        const todayPending = todayAppointments?.filter(apt => apt.status === 'scheduled').length || 0;

        setStats({
          todayTotal,
          todayCompleted,
          todayPending,
          weeklyGrowth: 12, // Mock data for now
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Agendamentos Hoje',
      value: stats.todayTotal,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Concluídos',
      value: stats.todayCompleted,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pendentes',
      value: stats.todayPending,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Crescimento Semanal',
      value: `+${stats.weeklyGrowth}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
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
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
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

export default AppointmentStats;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarCheck, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  Scissors,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Metrics {
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  activeBarbers: number;
  pendingAppointments: number;
  completedToday: number;
}

export const AdminMetricsCards: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalAppointments: 0,
    todayAppointments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalClients: 0,
    activeBarbers: 0,
    pendingAppointments: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          loadMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Total appointments
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Today's appointments
      const { count: todayAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', today)
        .lt('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Revenue calculations
      const { data: revenueData } = await supabase
        .from('appointments')
        .select(`
          status,
          service:services (price),
          start_time
        `)
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, apt) => sum + (apt.service?.price || 0), 0) || 0;
      const monthlyRevenue = revenueData?.filter(apt => apt.start_time >= startOfMonth)
        .reduce((sum, apt) => sum + (apt.service?.price || 0), 0) || 0;

      // Clients count
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Active barbers
      const { count: activeBarbers } = await supabase
        .from('barbers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Pending appointments
      const { count: pendingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString());

      // Completed today
      const { count: completedToday } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('start_time', today)
        .lt('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      setMetrics({
        totalAppointments: totalAppointments || 0,
        todayAppointments: todayAppointments || 0,
        totalRevenue,
        monthlyRevenue,
        totalClients: totalClients || 0,
        activeBarbers: activeBarbers || 0,
        pendingAppointments: pendingAppointments || 0,
        completedToday: completedToday || 0
      });
    } catch (error: any) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as métricas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      title: 'Agendamentos Hoje',
      value: metrics.todayAppointments,
      description: 'Agendamentos para hoje',
      icon: CalendarCheck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      badge: metrics.pendingAppointments > 0 ? `${metrics.pendingAppointments} pendentes` : null,
      badgeColor: 'bg-amber-500'
    },
    {
      title: 'Faturamento Mensal',
      value: `R$ ${metrics.monthlyRevenue.toFixed(2)}`,
      description: 'Receita do mês atual',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      badge: `Total: R$ ${metrics.totalRevenue.toFixed(2)}`,
      badgeColor: 'bg-green-600'
    },
    {
      title: 'Clientes Ativos',
      value: metrics.totalClients,
      description: 'Total de clientes cadastrados',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Barbeiros Ativos',
      value: metrics.activeBarbers,
      description: 'Profissionais disponíveis',
      icon: Scissors,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Concluídos Hoje',
      value: metrics.completedToday,
      description: 'Serviços finalizados hoje',
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Total de Agendamentos',
      value: metrics.totalAppointments,
      description: 'Histórico completo',
      icon: TrendingUp,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-800 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                
                {metric.badge && (
                  <Badge className={`${metric.badgeColor} text-white text-xs`}>
                    {metric.badge}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-bold text-white">
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-gray-300">
                  {metric.title}
                </p>
                <p className="text-xs text-gray-500">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminMetricsCards;

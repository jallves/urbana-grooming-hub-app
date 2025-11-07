import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Scissors, Settings, BarChart3, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminMetricsCards from './dashboard/AdminMetricsCards';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/contexts/RealtimeContext';

interface RecentActivity {
  id: string;
  type: 'appointment' | 'client' | 'staff';
  title: string;
  description: string;
  time: string;
  status?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivities();
  }, []);

  const loadRecentActivities = async () => {
    try {
      // Load recent appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          client:clients (name),
          service:services (name),
          staff:staff (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (appointmentsError) throw appointmentsError;

      // Load recent clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (clientsError) throw clientsError;

      const activities: RecentActivity[] = [];

      // Add appointment activities
      appointments?.forEach(apt => {
        activities.push({
          id: apt.id,
          type: 'appointment',
          title: `Agendamento ${apt.status === 'completed' ? 'concluído' : apt.status === 'cancelled' ? 'cancelado' : 'agendado'}`,
          description: `${apt.client?.name} - ${apt.service?.name} com ${apt.staff?.name}`,
          time: new Date(apt.start_time).toLocaleString('pt-BR'),
          status: apt.status
        });
      });

      // Add client activities
      clients?.forEach(client => {
        activities.push({
          id: client.id,
          type: 'client',
          title: 'Novo cliente cadastrado',
          description: client.name,
          time: new Date(client.created_at).toLocaleString('pt-BR')
        });
      });

      // Sort by time and take latest 10
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 10));
    } catch (error: any) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Gerenciar Agendamentos',
      description: 'Visualizar e editar agendamentos',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      action: () => navigate('/admin/agendamentos')
    },
    {
      title: 'Clientes',
      description: 'Gerenciar base de clientes',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      action: () => navigate('/admin/clientes')
    },
    {
      title: 'Barbeiros',
      description: 'Gerenciar equipe de barbeiros',
      icon: Scissors,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      action: () => navigate('/admin/barbeiros')
    },
    {
      title: 'Relatórios',
      description: 'Análises e estatísticas',
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      action: () => navigate('/admin/relatorios')
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: Settings,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      action: () => navigate('/admin/configuracoes')
    }
  ];

  return (
    <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-sm sm:text-base text-gray-600 font-raleway">
          Visão geral das operações da barbearia
        </p>
      </div>

      {/* Métricas */}
      <AdminMetricsCards />

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Ações Rápidas */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Ações Rápidas</CardTitle>
            <CardDescription className="text-gray-600">
              Acesso rápido aos módulos principais
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                
                return (
                  <div
                    key={index}
                    onClick={action.action}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-urbana-gold/50 active:scale-[0.98] touch-manipulation"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full ${action.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{action.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{action.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-gray-900 flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-gray-600 text-xs sm:text-sm">
              Últimas movimentações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {loading ? (
              <div className="space-y-2 sm:space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 sm:h-20 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                      activity.type === 'appointment' 
                        ? 'bg-blue-500/20 text-blue-600'
                        : activity.type === 'client'
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-amber-500/20 text-amber-600'
                    }`}>
                      {activity.type === 'appointment' && <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />}
                      {activity.type === 'client' && <Users className="h-3 w-3 sm:h-4 sm:w-4" />}
                      {activity.type === 'staff' && <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-1">{activity.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{activity.time}</p>
                    </div>
                    
                    {activity.status && (
                      <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 flex-shrink-0 rounded text-xs ${
                        activity.status === 'completed' 
                          ? 'bg-green-500/20 text-green-600'
                          : activity.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-600'
                          : 'bg-blue-500/20 text-blue-600'
                      }`}>
                        {activity.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm sm:text-base text-gray-600">Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

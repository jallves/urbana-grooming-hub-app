
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Scissors, Settings, BarChart3, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminMetricsCards from './dashboard/AdminMetricsCards';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivities();
    
    // Real-time subscription for activities
    const channel = supabase
      .channel('admin-activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          loadRecentActivities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients'
        },
        () => {
          loadRecentActivities();
          toast({
            title: "Novo cliente cadastrado",
            description: "Um novo cliente se cadastrou na plataforma.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-clash mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-400 font-inter">
          Visão geral das operações da barbearia
        </p>
      </div>

      {/* Métricas */}
      <AdminMetricsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ações Rápidas */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Ações Rápidas</CardTitle>
            <CardDescription className="text-gray-400">
              Acesso rápido aos módulos principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                
                return (
                  <div
                    key={index}
                    onClick={action.action}
                    className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors border border-gray-700 hover:border-gray-600"
                  >
                    <div className={`w-10 h-10 rounded-full ${action.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{action.title}</p>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-gray-400">
              Últimas movimentações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'appointment' 
                        ? 'bg-blue-500/20 text-blue-400'
                        : activity.type === 'client'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {activity.type === 'appointment' && <Calendar className="h-4 w-4" />}
                      {activity.type === 'client' && <Users className="h-4 w-4" />}
                      {activity.type === 'staff' && <Scissors className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    
                    {activity.status && (
                      <div className={`px-2 py-1 rounded text-xs ${
                        activity.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400'
                          : activity.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {activity.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Clock, DollarSign, User, TrendingUp, Star } from 'lucide-react';
import { useRealTimeAppointments } from '@/components/appointment/client/hooks/useRealTimeAppointments';

interface ClientMetricsProps {
  clientId: string;
}

export const ClientMetrics: React.FC<ClientMetricsProps> = ({ clientId }) => {
  const { appointments, loading } = useRealTimeAppointments(clientId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-800 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const upcomingAppointments = appointments.filter(a => {
    const appointmentDate = new Date(a.start_time);
    return appointmentDate > new Date() && ['scheduled', 'confirmed'].includes(a.status);
  }).length;
  const totalSpent = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + a.service.price, 0);

  const metrics = [
    {
      title: 'Total de Agendamentos',
      value: totalAppointments,
      description: 'Histórico completo',
      icon: CalendarCheck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Próximos Agendamentos',
      value: upcomingAppointments,
      description: 'Confirmados e agendados',
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Serviços Concluídos',
      value: completedAppointments,
      description: 'Histórico de serviços',
      icon: Star,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Total Investido',
      value: `R$ ${totalSpent.toFixed(2)}`,
      description: 'Em serviços realizados',
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-white">
                      {metric.value}
                    </p>
                    <p className="text-sm font-medium text-gray-300">
                      {metric.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {metric.description}
                    </p>
                  </div>
                </div>
                
                {index === 1 && upcomingAppointments > 0 && (
                  <Badge className="bg-amber-500 text-black">
                    {upcomingAppointments}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClientMetrics;

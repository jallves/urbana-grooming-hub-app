import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface PainelAgendamento {
  id: string;
  status: string;
  painel_clientes: {
    nome: string;
    email: string;
    whatsapp: string;
  };
  painel_barbeiros: {
    nome: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
  };
}

interface ClientAppointmentStatsProps {
  appointments: PainelAgendamento[];
}

const ClientAppointmentStats: React.FC<ClientAppointmentStatsProps> = ({ appointments }) => {
  const stats = React.useMemo(() => {
    const total = appointments.length;
    const confirmados = appointments.filter(a => a.status === 'confirmado').length;
    const concluidos = appointments.filter(a => a.status === 'concluido').length;
    const cancelados = appointments.filter(a => a.status === 'cancelado').length;
    
    return { total, confirmados, concluidos, cancelados };
  }, [appointments]);

  const statCards = [
    {
      title: 'Total de Agendamentos',
      value: stats.total,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900'
    },
    {
      title: 'Confirmados',
      value: stats.confirmados,
      icon: Clock,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900'
    },
    {
      title: 'Concluídos',
      value: stats.concluidos,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-900'
    },
    {
      title: 'Cancelados',
      value: stats.cancelados,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-900'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-gray-900 border border-gray-800 shadow-sm">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-100">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientAppointmentStats;

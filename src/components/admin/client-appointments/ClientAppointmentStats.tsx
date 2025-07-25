
import React from 'react';
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PainelAgendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  created_at: string;
  updated_at: string;
  painel_clientes: {
    nome: string;
    email: string;
    whatsapp: string;
  };
  painel_barbeiros: {
    nome: string;
    email: string;
    telefone: string;
    image_url: string;
    specialties: string;
    experience: string;
    commission_rate: number;
    is_active: boolean;
    role: string;
    staff_id: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

interface ClientAppointmentStatsProps {
  appointments: PainelAgendamento[];
}

const ClientAppointmentStats: React.FC<ClientAppointmentStatsProps> = ({ appointments }) => {
  const stats = {
    total: appointments.length,
    agendados: appointments.filter(apt => apt.status === 'agendado').length,
    confirmados: appointments.filter(apt => apt.status === 'confirmado').length,
    concluidos: appointments.filter(apt => apt.status === 'concluido').length,
    cancelados: appointments.filter(apt => apt.status === 'cancelado').length,
  };

  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20',
    },
    {
      title: 'Agendados',
      value: stats.agendados,
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/20',
    },
    {
      title: 'Confirmados',
      value: stats.confirmados,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20',
    },
    {
      title: 'Concluídos',
      value: stats.concluidos,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-600/20',
    },
    {
      title: 'Cancelados',
      value: stats.cancelados,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-600/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-100">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientAppointmentStats;

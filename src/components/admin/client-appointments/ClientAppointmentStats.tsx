
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
    concluidos: appointments.filter(apt => apt.status === 'concluido' || apt.status === 'FINALIZADO').length,
    cancelados: appointments.filter(apt => apt.status === 'cancelado').length,
  };

  const statCards = [
    {
      title: 'Total de Agendamentos',
      value: stats.total,
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'todos os agendamentos'
    },
    {
      title: 'Agendados',
      value: stats.agendados,
      icon: AlertCircle,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      description: 'aguardando confirmação'
    },
    {
      title: 'Confirmados',
      value: stats.confirmados,
      icon: Clock,
      gradient: 'from-indigo-500 to-purple-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      description: 'confirmados pelo cliente'
    },
    {
      title: 'Concluídos',
      value: stats.concluidos,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      description: 'atendimentos finalizados'
    },
    {
      title: 'Cancelados',
      value: stats.cancelados,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      description: 'agendamentos cancelados'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="relative overflow-hidden border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Gradiente de fundo sutil */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-gray-700 mb-1 font-raleway">
                  {stat.title}
                </CardTitle>
                <p className="text-xs text-gray-500 font-raleway">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent font-playfair`}>
              {stat.value}
            </div>
          </CardContent>
          
          {/* Barra decorativa no rodapé */}
          <div className={`h-1 w-full bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
        </Card>
      ))}
    </div>
  );
};

export default ClientAppointmentStats;

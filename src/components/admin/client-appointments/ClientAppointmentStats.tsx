
import React from 'react';
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle, UserX } from 'lucide-react';
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
    email: string | null;
    whatsapp: string | null;
  } | null;
  painel_barbeiros: {
    nome: string;
    email: string | null;
    telefone: string | null;
    image_url: string | null;
    specialties: string[] | null;
    experience: string | null;
    commission_rate: number | null;
    is_active: boolean | null;
    role: string | null;
    staff_id: string | null;
  } | null;
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  } | null;
  totem_sessions?: Array<{
    check_in_time: string | null;
    check_out_time: string | null;
    status: string | null;
  }>;
}

interface ClientAppointmentStatsProps {
  appointments: PainelAgendamento[];
}

const ClientAppointmentStats: React.FC<ClientAppointmentStatsProps> = ({ appointments }) => {
  // LEI PÉTREA: Calcular estatísticas baseadas nos estados (incluindo ausente)
  const getAppointmentStatus = (apt: PainelAgendamento): string => {
    const statusLower = apt.status?.toLowerCase() || '';
    
    // PRIORIDADE 1: Status manual do banco (ausente, cancelado)
    if (statusLower === 'ausente') {
      return 'ausente';
    }
    
    if (statusLower === 'cancelado') {
      return 'cancelado';
    }

    // PRIORIDADE 2: Status baseado em check-in/check-out
    const hasCheckIn = apt.totem_sessions && 
      apt.totem_sessions.some(s => s.check_in_time);
    
    const hasCheckOut = apt.totem_sessions && 
      apt.totem_sessions.some(s => s.check_out_time);

    if (!hasCheckIn) return 'agendado'; // Check-in Pendente
    if (hasCheckIn && !hasCheckOut) return 'check_in_finalizado'; // Checkout Pendente
    return 'concluido'; // Concluído
  };

  const stats = {
    total: appointments.length,
    agendados: appointments.filter(apt => getAppointmentStatus(apt) === 'agendado').length,
    checkInFinalizados: appointments.filter(apt => getAppointmentStatus(apt) === 'check_in_finalizado').length,
    concluidos: appointments.filter(apt => getAppointmentStatus(apt) === 'concluido').length,
    ausentes: appointments.filter(apt => getAppointmentStatus(apt) === 'ausente').length,
    cancelados: appointments.filter(apt => getAppointmentStatus(apt) === 'cancelado').length,
  };

  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'agendamentos'
    },
    {
      title: 'Agendado',
      value: stats.agendados,
      icon: AlertCircle,
      gradient: 'from-blue-500 to-indigo-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'check-in pendente'
    },
    {
      title: 'Check-in',
      value: stats.checkInFinalizados,
      icon: Clock,
      gradient: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      description: 'checkout pendente'
    },
    {
      title: 'Concluído',
      value: stats.concluidos,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      description: 'finalizados'
    },
    {
      title: 'Ausente',
      value: stats.ausentes,
      icon: UserX,
      gradient: 'from-gray-500 to-slate-500',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      description: 'não compareceu'
    },
    {
      title: 'Cancelado',
      value: stats.cancelados,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      description: 'cancelados'
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {statCards.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Gradiente de fundo sutil */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          
          <CardHeader className="pb-2 relative z-10 p-2.5 sm:p-3">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-[11px] sm:text-xs font-semibold text-gray-700 mb-0.5 font-raleway leading-tight truncate">
                  {stat.title}
                </CardTitle>
                <p className="text-[9px] sm:text-[10px] text-gray-500 font-raleway leading-tight truncate">{stat.description}</p>
              </div>
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                <stat.icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2.5 sm:pb-3 px-2.5 sm:px-3 relative z-10">
            <div className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent font-playfair`}>
              {stat.value}
            </div>
          </CardContent>
          
          {/* Barra decorativa no rodapé */}
          <div className={`h-0.5 w-full bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
        </Card>
      ))}
    </div>
  );
};

export default ClientAppointmentStats;

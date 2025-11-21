
import React from 'react';
import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import StandardCard from './layouts/StandardCard';
import AppointmentCardOptimized from './appointments/AppointmentCardOptimized';
import AppointmentSkeleton from '@/components/ui/loading/AppointmentSkeleton';
import { useBarberAppointmentsOptimized } from '@/hooks/barber/useBarberAppointmentsOptimized';

const BarberAppointments: React.FC = () => {
  const {
    appointments,
    loading,
    stats
  } = useBarberAppointmentsOptimized();

  const statsCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Calendar,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-blue-600/5'
    },
    {
      title: 'Concluídos',
      value: stats.completed,
      icon: Clock,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-green-600/5'
    },
    {
      title: 'Próximos',
      value: stats.upcoming,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/10 to-orange-600/5'
    },
    {
      title: 'Receita',
      value: `R$ ${stats.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-urbana-gold',
      bgGradient: 'from-yellow-500/10 to-amber-600/5'
    }
  ];

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col space-y-4 sm:space-y-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          {[...Array(4)].map((_, i) => (
            <StandardCard key={i}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            </StandardCard>
          ))}
        </div>
        <AppointmentSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 sm:space-y-6 pb-4 min-h-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        {statsCards.map((stat, index) => (
          <StandardCard key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </StandardCard>
        ))}
      </div>

      {/* Appointments List */}
      <StandardCard className="flex-1 flex flex-col min-h-0">
        <div className="mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Meus Agendamentos</h2>
          <p className="text-sm text-gray-400 mt-1">Visualização dos seus atendimentos</p>
        </div>
        
        {appointments.length === 0 ? (
          <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-500">
              Seus agendamentos aparecerão aqui quando forem criados.
            </p>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-2">
            {appointments.map((appointment) => (
              <AppointmentCardOptimized
                key={appointment.id}
                appointment={appointment}
              />
            ))}
          </div>
        )}
      </StandardCard>
    </div>
  );
};

export default BarberAppointments;

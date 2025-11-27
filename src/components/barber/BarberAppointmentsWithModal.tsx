import React, { useMemo } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import StandardCard from './layouts/StandardCard';
import AppointmentCardOptimized from './appointments/AppointmentCardOptimized';
import BarberEditAppointmentModal from './appointments/BarberEditAppointmentModal';
import AppointmentSkeleton from '@/components/ui/loading/AppointmentSkeleton';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
import { useBarberAppointmentsQuery } from '@/hooks/barber/queries/useBarberAppointmentsQuery';
import { useBarberAppointmentModal } from '@/hooks/barber/useBarberAppointmentModal';

const BarberAppointmentsWithModal: React.FC = () => {
  const { data: barberData } = useBarberDataQuery();
  const { data: appointments = [], isLoading, refetch } = useBarberAppointmentsQuery(barberData?.id || null);
  const modalHandlers = useBarberAppointmentModal();

  // Calcular stats localmente com useMemo
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const upcoming = appointments.filter(a => 
      a.status !== 'completed' && 
      a.status !== 'cancelled' && 
      new Date(a.start_time) > new Date()
    ).length;
    
    const revenue = appointments
      .filter(a => a.status === 'completed')
      .reduce((acc, appointment) => {
        const servicePrice = appointment.service?.price || 0;
        return acc + Number(servicePrice);
      }, 0);

    return { total, completed, upcoming, revenue };
  }, [appointments]);

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

  if (isLoading) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StandardCard key={i}>
              <div className="animate-pulse">
                <div className="h-4 bg-urbana-black/60 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-urbana-black/60 rounded w-1/2"></div>
              </div>
            </StandardCard>
          ))}
        </div>
        <AppointmentSkeleton count={5} />
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <StandardCard key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-urbana-light/70">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-urbana-light">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </div>
            </StandardCard>
          ))}
        </div>

        {/* Appointments List */}
        <StandardCard>
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-urbana-light">Meus Agendamentos</h2>
            <p className="text-xs sm:text-sm text-urbana-light/70 mt-1">
              Gerencie seus atendimentos - Edite horários ou marque ausências
            </p>
          </div>
          
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-urbana-light/40 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-urbana-light mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-sm text-urbana-light/60">
                Seus agendamentos aparecerão aqui quando forem criados.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCardOptimized
                  key={appointment.id}
                  appointment={appointment}
                  onEdit={modalHandlers.handleEditAppointment}
                />
              ))}
            </div>
          )}
        </StandardCard>
      </div>

      {/* Modal de Edição */}
      {barberData && (
        <BarberEditAppointmentModal
          isOpen={modalHandlers.isEditModalOpen}
          onClose={modalHandlers.closeEditModal}
          appointmentId={modalHandlers.selectedAppointmentId}
          barberId={barberData.id}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
};

export default BarberAppointmentsWithModal;

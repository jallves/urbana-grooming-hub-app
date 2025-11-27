import React, { useMemo } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import AppointmentCardOptimized from './appointments/AppointmentCardOptimized';
import BarberEditAppointmentModal from './appointments/BarberEditAppointmentModal';
import AppointmentSkeleton from '@/components/ui/loading/AppointmentSkeleton';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
import { useBarberAppointmentsQuery } from '@/hooks/barber/queries/useBarberAppointmentsQuery';
import { useBarberAppointmentModal } from '@/hooks/barber/useBarberAppointmentModal';
import { 
  PainelBarbeiroCard, 
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardContent 
} from '@/components/barber/PainelBarbeiroCard';
import { cn } from '@/lib/utils';

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
      variant: 'default' as const,
    },
    {
      title: 'Concluídos',
      value: stats.completed,
      icon: Clock,
      variant: 'success' as const,
    },
    {
      title: 'Próximos',
      value: stats.upcoming,
      icon: TrendingUp,
      variant: 'warning' as const,
    },
    {
      title: 'Receita',
      value: `R$ ${stats.revenue.toFixed(2)}`,
      icon: DollarSign,
      variant: 'highlight' as const,
    }
  ];

  if (isLoading) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <PainelBarbeiroCard key={i} variant="default">
              <PainelBarbeiroCardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-urbana-black/60 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-urbana-black/60 rounded w-1/2"></div>
                </div>
              </PainelBarbeiroCardContent>
            </PainelBarbeiroCard>
          ))}
        </div>
        <AppointmentSkeleton count={5} />
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
        {/* Stats Cards - Mobile First */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {statsCards.map((stat, index) => {
            const IconComp = stat.icon;
            return (
              <PainelBarbeiroCard key={index} variant={stat.variant}>
                <PainelBarbeiroCardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <div className="flex items-center justify-between">
                    <PainelBarbeiroCardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70">
                      {stat.title}
                    </PainelBarbeiroCardTitle>
                    <div className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                      stat.variant === 'default' && 'bg-blue-500/20',
                      stat.variant === 'success' && 'bg-green-500/20',
                      stat.variant === 'warning' && 'bg-orange-500/20',
                      stat.variant === 'highlight' && 'bg-urbana-gold/20',
                    )}>
                      <IconComp className={cn(
                        'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6',
                        stat.variant === 'default' && 'text-blue-400',
                        stat.variant === 'success' && 'text-green-400',
                        stat.variant === 'warning' && 'text-orange-400',
                        stat.variant === 'highlight' && 'text-urbana-gold',
                      )} />
                    </div>
                  </div>
                </PainelBarbeiroCardHeader>
                <PainelBarbeiroCardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light leading-tight">
                    {stat.value}
                  </p>
                </PainelBarbeiroCardContent>
              </PainelBarbeiroCard>
            );
          })}
        </div>

        {/* Appointments List */}
        <PainelBarbeiroCard variant="default">
          <PainelBarbeiroCardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <PainelBarbeiroCardTitle className="text-base sm:text-lg md:text-xl font-bold text-urbana-light leading-tight">
              Meus Agendamentos
            </PainelBarbeiroCardTitle>
            <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/70 mt-1 leading-tight">
              Gerencie seus atendimentos - Toque para editar
            </p>
          </PainelBarbeiroCardHeader>
          
          <PainelBarbeiroCardContent className="px-4 sm:px-6">
            {appointments.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-urbana-light/40 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-urbana-light mb-1 sm:mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-xs sm:text-sm text-urbana-light/60">
                  Seus agendamentos aparecerão aqui quando forem criados.
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {appointments.map((appointment) => (
                  <AppointmentCardOptimized
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={modalHandlers.handleEditAppointment}
                  />
                ))}
              </div>
            )}
          </PainelBarbeiroCardContent>
        </PainelBarbeiroCard>
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

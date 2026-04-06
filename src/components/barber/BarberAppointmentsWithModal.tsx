import React, { useMemo, useState, useCallback } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp, Zap, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppointmentCardOptimized from './appointments/AppointmentCardOptimized';
import BarberEditAppointmentModal from './appointments/BarberEditAppointmentModal';
import BarberEncaixeModal from './appointments/BarberEncaixeModal';
import AppointmentSkeleton from '@/components/ui/loading/AppointmentSkeleton';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
import { useBarberAppointmentsQuery } from '@/hooks/barber/queries/useBarberAppointmentsQuery';
import { useBarberAppointmentModal } from '@/hooks/barber/useBarberAppointmentModal';
import BarberFilter from '@/components/barber/BarberFilter';
import { 
  PainelBarbeiroCard, 
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardContent 
} from '@/components/barber/PainelBarbeiroCard';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

const BarberAppointmentsWithModal: React.FC = () => {
  const { data: barberData } = useBarberDataQuery();
  const isBarberAdmin = barberData?.is_barber_admin || false;
  
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const activeBarberId = selectedBarberId || barberData?.id || null;
  
  // Date filter state - defaults to today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const { data: appointments = [], isLoading, refetch } = useBarberAppointmentsQuery(activeBarberId);
  const modalHandlers = useBarberAppointmentModal();

  const [isEncaixeModalOpen, setIsEncaixeModalOpen] = useState(false);
  const [encaixeSlotDate, setEncaixeSlotDate] = useState<string | undefined>();
  const [encaixeSlotTime, setEncaixeSlotTime] = useState<string | undefined>();

  const handleOpenEncaixe = useCallback((date?: string, time?: string) => {
    setEncaixeSlotDate(date);
    setEncaixeSlotTime(time);
    setIsEncaixeModalOpen(true);
  }, []);

  const handleCloseEncaixe = useCallback(() => {
    setIsEncaixeModalOpen(false);
    setEncaixeSlotDate(undefined);
    setEncaixeSlotTime(undefined);
  }, []);

  const isViewingOther = isBarberAdmin && selectedBarberId && selectedBarberId !== barberData?.id;

  // Filter appointments by selected date
  const filteredAppointments = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return appointments
      .filter(a => a.start_time.startsWith(dateStr))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments, selectedDate]);

  // Stats for the selected day
  const stats = useMemo(() => {
    const total = filteredAppointments.length;
    const completed = filteredAppointments.filter(a => a.status === 'completed').length;
    const upcoming = filteredAppointments.filter(a => 
      a.status !== 'completed' && 
      a.status !== 'cancelled' && 
      new Date(a.start_time) > new Date()
    ).length;
    
    const revenue = filteredAppointments
      .filter(a => a.status === 'completed')
      .reduce((acc, appointment) => {
        const servicePrice = appointment.service?.price || 0;
        return acc + Number(servicePrice);
      }, 0);

    return { total, completed, upcoming, revenue };
  }, [filteredAppointments]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  const statsCards = [
    { title: 'Total', value: stats.total, icon: Calendar, variant: 'default' as const },
    { title: 'Concluídos', value: stats.completed, icon: Clock, variant: 'success' as const },
    { title: 'Próximos', value: stats.upcoming, icon: TrendingUp, variant: 'warning' as const },
    { title: 'Receita', value: `R$ ${stats.revenue.toFixed(2)}`, icon: DollarSign, variant: 'highlight' as const },
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
        {/* Barber Admin Filter */}
        {isBarberAdmin && barberData && (
          <div className="flex items-center justify-end">
            <BarberFilter
              isBarberAdmin={isBarberAdmin}
              currentBarberId={barberData.id}
              selectedBarberId={activeBarberId || barberData.id}
              onBarberChange={setSelectedBarberId}
            />
          </div>
        )}

        {/* Date Navigation */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevDay}
              className="h-8 w-8 sm:h-9 sm:w-9 border-urbana-gold/20 bg-transparent text-urbana-light"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 sm:h-9 px-3 sm:px-4 border-urbana-gold/20 bg-transparent text-urbana-light text-xs sm:text-sm font-semibold capitalize min-w-[140px] sm:min-w-[180px]"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-urbana-gold" />
                  {isToday(selectedDate)
                    ? `Hoje — ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                    : format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-urbana-black border-urbana-gold/30" align="start">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              className="h-8 w-8 sm:h-9 sm:w-9 border-urbana-gold/20 bg-transparent text-urbana-light"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isToday(selectedDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 text-xs sm:text-sm border-urbana-gold/20 bg-transparent text-urbana-gold"
            >
              Hoje
            </Button>
          )}
        </div>

        {/* Stats Cards */}
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
            <div className="flex items-center justify-between">
              <div>
                <PainelBarbeiroCardTitle className="text-base sm:text-lg md:text-xl font-bold text-urbana-light leading-tight">
                  {isViewingOther ? 'Agendamentos' : 'Meus Agendamentos'}
                </PainelBarbeiroCardTitle>
                <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/70 mt-1 leading-tight">
                  {filteredAppointments.length} agendamento(s) para {isToday(selectedDate) ? 'hoje' : format(selectedDate, "dd/MM/yyyy")}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenEncaixe()}
                className="h-8 sm:h-9 px-3 bg-purple-600 text-white hover:bg-purple-700 text-xs sm:text-sm touch-manipulation font-semibold"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Encaixe
              </Button>
            </div>
          </PainelBarbeiroCardHeader>
          
          <PainelBarbeiroCardContent className="px-4 sm:px-6">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-urbana-light/40 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-urbana-light mb-1 sm:mb-2">
                  Nenhum agendamento para este dia
                </h3>
                <p className="text-xs sm:text-sm text-urbana-light/60">
                  {isViewingOther ? 'Este barbeiro não possui agendamentos nesta data.' : 'Use as setas para navegar entre os dias.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCardOptimized
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={modalHandlers.handleEditAppointment}
                    onEncaixe={handleOpenEncaixe}
                  />
                ))}
              </div>
            )}
          </PainelBarbeiroCardContent>
        </PainelBarbeiroCard>
      </div>

      {/* Modal de Edição */}
      {activeBarberId && (
        <>
          <BarberEditAppointmentModal
            isOpen={modalHandlers.isEditModalOpen}
            onClose={modalHandlers.closeEditModal}
            appointmentId={modalHandlers.selectedAppointmentId}
            barberId={activeBarberId}
            onSuccess={() => refetch()}
          />
          <BarberEncaixeModal
            isOpen={isEncaixeModalOpen}
            onClose={handleCloseEncaixe}
            barberId={activeBarberId}
            slotDate={encaixeSlotDate}
            slotTime={encaixeSlotTime}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </>
  );
};

export default BarberAppointmentsWithModal;

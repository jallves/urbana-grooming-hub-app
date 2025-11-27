import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBarberAppointments } from '@/hooks/useBarberAppointments';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';
import { 
  PainelBarbeiroCard, 
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardContent 
} from '@/components/barber/PainelBarbeiroCard';

const BarberScheduleView: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { appointments, loading } = useBarberAppointments();

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const appointmentsByDay = useMemo(() => {
    const groupedAppointments: { [key: string]: any[] } = {};
    
    appointments.forEach(appointment => {
      const appointmentDate = parseISO(appointment.data);
      const dayKey = format(appointmentDate, 'yyyy-MM-dd');
      
      if (!groupedAppointments[dayKey]) {
        groupedAppointments[dayKey] = [];
      }
      
      groupedAppointments[dayKey].push(appointment);
    });

    Object.keys(groupedAppointments).forEach(day => {
      groupedAppointments[day].sort((a, b) => a.hora.localeCompare(b.hora));
    });

    return groupedAppointments;
  }, [appointments]);

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'confirmado': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      'concluido': 'bg-green-500/20 text-green-300 border-green-500/40',
      'cancelado': 'bg-red-500/20 text-red-300 border-red-500/40'
    };
    return colors[status as keyof typeof colors] || colors.confirmado;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'confirmado': 'Conf.',
      'concluido': 'Feito',
      'cancelado': 'Canc.'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <BarberPageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </BarberPageContainer>
    );
  }

  return (
    <BarberPageContainer hideHeader>
      {/* Header com navegação - 100% responsivo */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6 pb-4 border-b border-urbana-gold/20">
        {/* Título */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-urbana-gold flex-shrink-0" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-gold font-playfair truncate">
            {format(currentWeek, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
        
        {/* Navegação */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold h-8 w-8 p-0 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentWeek}
            className="border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold px-3 h-8 text-xs sm:text-sm flex-1 max-w-[120px]"
          >
            Hoje
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold h-8 w-8 p-0 flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid - Responsivo */}
      <div className="w-full mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointmentsByDay[dayKey] || [];
            const isCurrentDay = isToday(day);

            return (
              <PainelBarbeiroCard 
                key={dayKey} 
                variant={isCurrentDay ? 'highlight' : 'default'}
                className={`flex flex-col ${
                  isCurrentDay ? 'ring-2 ring-urbana-gold/60' : ''
                }`}
              >
                {/* Header do dia - Compacto */}
                <div className={`flex items-center justify-between p-2.5 sm:p-3 border-b border-urbana-gold/10 ${
                  isCurrentDay ? 'bg-urbana-gold/10' : ''
                }`}>
                  <span className={`text-sm font-semibold capitalize ${
                    isCurrentDay ? 'text-urbana-gold' : 'text-urbana-light'
                  }`}>
                    {format(day, 'EEEE', { locale: ptBR })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isCurrentDay 
                      ? 'bg-urbana-gold text-urbana-black font-bold' 
                      : 'bg-urbana-black/30 text-urbana-light/70'
                  }`}>
                    {format(day, 'dd/MM')}
                  </span>
                </div>
                
                {/* Conteúdo - Lista de agendamentos */}
                <div className="p-2.5 sm:p-3 flex-1">
                  {dayAppointments.length === 0 ? (
                    <div className="flex items-center justify-center py-4 sm:py-6">
                      <p className="text-xs text-urbana-light/40 text-center">
                        Sem agendamentos
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="bg-urbana-black/30 border border-urbana-gold/10 rounded-lg p-2.5 hover:bg-urbana-black/40 hover:border-urbana-gold/20 transition-all"
                        >
                          {/* Linha 1: Hora + Status */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Clock className="w-3.5 h-3.5 text-urbana-gold flex-shrink-0" />
                              <span className="text-sm font-bold text-urbana-light">
                                {appointment.hora}
                              </span>
                            </div>
                            <Badge className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${getStatusColor(appointment.status)}`}>
                              {getStatusLabel(appointment.status)}
                            </Badge>
                          </div>
                          
                          {/* Linha 2: Cliente */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-urbana-light/90 truncate">
                              {appointment.painel_clientes?.nome || 'Cliente'}
                            </span>
                          </div>
                          
                          {/* Linha 3: Serviço + Preço */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <Scissors className="w-3 h-3 text-purple-400 flex-shrink-0" />
                              <span className="text-[11px] text-urbana-light/60 truncate">
                                {appointment.painel_servicos?.nome || 'Serviço'}
                              </span>
                            </div>
                            <span className="text-xs text-urbana-gold font-bold flex-shrink-0">
                              R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Footer com contagem */}
                {dayAppointments.length > 0 && (
                  <div className="px-2.5 sm:px-3 py-2 border-t border-urbana-gold/10 bg-urbana-black/20">
                    <p className="text-[10px] text-urbana-light/50 text-center">
                      {dayAppointments.length} agendamento{dayAppointments.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </PainelBarbeiroCard>
            );
          })}
        </div>
      </div>

      {/* Resumo da semana - Compacto e responsivo */}
      <PainelBarbeiroCard variant="default">
        <div className="p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-urbana-light mb-3 text-center">
            Resumo da Semana
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-2 bg-urbana-black/30 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-urbana-light">
                {Object.values(appointmentsByDay).flat().length}
              </p>
              <p className="text-[10px] sm:text-xs text-urbana-light/60">Total</p>
            </div>
            <div className="text-center p-2 bg-green-500/10 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-green-400">
                {Object.values(appointmentsByDay).flat().filter(apt => apt.status === 'concluido').length}
              </p>
              <p className="text-[10px] sm:text-xs text-urbana-light/60">Feitos</p>
            </div>
            <div className="text-center p-2 bg-blue-500/10 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-blue-400">
                {Object.values(appointmentsByDay).flat().filter(apt => apt.status === 'confirmado').length}
              </p>
              <p className="text-[10px] sm:text-xs text-urbana-light/60">Confirm.</p>
            </div>
          </div>
        </div>
      </PainelBarbeiroCard>
    </BarberPageContainer>
  );
};

export default BarberScheduleView;


import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBarberAppointments } from '@/hooks/useBarberAppointments';

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Header com navegação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light">
            {format(currentWeek, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold h-9 px-3"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentWeek}
            className="border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold px-4 h-9"
          >
            Hoje
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold h-9 px-3"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointmentsByDay[dayKey] || [];
            const isCurrentDay = isToday(day);

            return (
              <Card 
                key={dayKey} 
                className={`backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20 transition-all duration-300 hover:bg-urbana-black/60 hover:border-urbana-gold/40 flex flex-col min-h-[400px] ${
                  isCurrentDay ? 'ring-2 ring-urbana-gold/60 border-urbana-gold/60' : ''
                }`}
              >
                <CardHeader className="pb-3 flex-shrink-0 p-4 border-b border-urbana-gold/10">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    <div className="flex items-center justify-between">
                      <span className={`capitalize ${isCurrentDay ? 'text-urbana-gold' : 'text-urbana-light'}`}>
                        {format(day, 'EEE', { locale: ptBR })}
                      </span>
                      <span className={`text-xs sm:text-sm ${isCurrentDay ? 'text-urbana-gold' : 'text-urbana-light/60'}`}>
                        {format(day, 'dd')}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col space-y-2 p-3 sm:p-4 overflow-y-auto">
                  {dayAppointments.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-xs sm:text-sm text-urbana-light/40 text-center">
                        Sem agendamentos
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="backdrop-blur-sm bg-urbana-black/30 border border-urbana-gold/10 rounded-xl p-3 space-y-2 hover:bg-urbana-black/40 hover:border-urbana-gold/20 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-urbana-light flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-urbana-gold" />
                              {appointment.hora}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1.5">
                            <p className="text-xs sm:text-sm text-urbana-light/90 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-400" />
                              {appointment.painel_clientes?.nome || 'Cliente não encontrado'}
                            </p>
                            <p className="text-xs text-urbana-light/60 truncate">
                              {appointment.painel_servicos?.nome || 'Serviço não encontrado'}
                            </p>
                            <p className="text-xs sm:text-sm text-urbana-gold font-semibold">
                              R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Resumo da semana */}
      <Card className="backdrop-blur-xl bg-urbana-black/40 border-urbana-gold/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base text-urbana-light">Resumo da Semana</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-urbana-light">
                {Object.values(appointmentsByDay).flat().length}
              </p>
              <p className="text-xs sm:text-sm text-urbana-light/60 mt-1">Total</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-green-400">
                {Object.values(appointmentsByDay).flat().filter(apt => apt.status === 'concluido').length}
              </p>
              <p className="text-xs sm:text-sm text-urbana-light/60 mt-1">Concluídos</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">
                {Object.values(appointmentsByDay).flat().filter(apt => apt.status === 'confirmado').length}
              </p>
              <p className="text-xs sm:text-sm text-urbana-light/60 mt-1">Confirmados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberScheduleView;

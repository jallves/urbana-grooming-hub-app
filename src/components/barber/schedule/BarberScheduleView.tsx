
import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
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
      const appointmentDate = new Date(appointment.data);
      const dayKey = format(appointmentDate, 'yyyy-MM-dd');
      
      if (!groupedAppointments[dayKey]) {
        groupedAppointments[dayKey] = [];
      }
      
      groupedAppointments[dayKey].push(appointment);
    });

    // Ordenar agendamentos por horário
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
      <div className="flex-1 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <div className="flex-1 flex flex-col space-y-4 sm:space-y-6">
        {/* Header com navegação */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-urbana-gold" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {format(currentWeek, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="border-gray-700 text-gray-300 hover:bg-gray-700/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className="border-gray-700 text-gray-300 hover:bg-gray-700/50 px-3"
            >
              Hoje
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="border-gray-700 text-gray-300 hover:bg-gray-700/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4 min-h-full">
            {weekDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDay[dayKey] || [];
              const isCurrentDay = isToday(day);

              return (
                <Card 
                  key={dayKey} 
                  className={`bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 transition-all duration-200 flex flex-col min-h-[300px] ${
                    isCurrentDay ? 'ring-2 ring-urbana-gold/50' : ''
                  }`}
                >
                  <CardHeader className="pb-2 flex-shrink-0">
                    <CardTitle className="text-sm font-medium">
                      <div className="flex items-center justify-between">
                        <span className={`${isCurrentDay ? 'text-urbana-gold' : 'text-white'}`}>
                          {format(day, 'EEE', { locale: ptBR })}
                        </span>
                        <span className={`text-xs ${isCurrentDay ? 'text-urbana-gold' : 'text-gray-400'}`}>
                          {format(day, 'dd')}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col space-y-2">
                    {dayAppointments.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-gray-500 text-center">
                          Sem agendamentos
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 flex-1 overflow-y-auto">
                        {dayAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="bg-gray-700/30 rounded-lg p-2 space-y-1 flex-shrink-0"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white flex items-center gap-1">
                                <Clock className="w-3 h-3 text-urbana-gold" />
                                {appointment.hora}
                              </span>
                              <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-xs text-gray-300 flex items-center gap-1">
                                <User className="w-3 h-3 text-blue-400" />
                                {appointment.painel_clientes?.nome || 'Cliente não encontrado'}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {appointment.painel_servicos?.nome || 'Serviço não encontrado'}
                              </p>
                              <p className="text-xs text-urbana-gold font-medium">
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

        {/* Resumo da semana - Mobile */}
        <div className="sm:hidden flex-shrink-0">
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-sm text-white">Resumo da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-white">
                    {Object.values(appointmentsByDay).flat().length}
                  </p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-400">
                    {Object.values(appointmentsByDay).flat().filter(apt => apt.status === 'concluido').length}
                  </p>
                  <p className="text-xs text-gray-400">Concluídos</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-400">
                    {Object.values(appointmentsByDay).flat().filter(apt => apt.status === 'confirmado').length}
                  </p>
                  <p className="text-xs text-gray-400">Confirmados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BarberScheduleView;

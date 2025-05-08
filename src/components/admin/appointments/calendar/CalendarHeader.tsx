
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarHeaderProps {
  date: Date;
  viewMode: 'day' | 'week';
  setDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week') => void;
  onNewAppointment: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  date,
  viewMode,
  setDate,
  setViewMode,
  onNewAppointment
}) => {
  const startDate = viewMode === 'week' ? startOfWeek(date, { weekStartsOn: 1 }) : date;
  const endDate = viewMode === 'week' ? endOfWeek(date, { weekStartsOn: 1 }) : date;
  
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => setViewMode('day')} 
          className={viewMode === 'day' ? 'bg-gray-100' : ''}
        >
          Dia
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setViewMode('week')} 
          className={viewMode === 'week' ? 'bg-gray-100' : ''}
        >
          Semana
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setDate(prev => addDays(prev, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium">
          {viewMode === 'day' 
            ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            : `${format(startDate, "dd/MM", { locale: ptBR })} - ${format(endDate, "dd/MM", { locale: ptBR })}`
          }
        </span>
        
        <Button variant="outline" size="icon" onClick={() => setDate(prev => addDays(prev, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
          Hoje
        </Button>
      </div>
      
      <Button onClick={onNewAppointment}>
        <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
      </Button>
    </div>
  );
};

export default CalendarHeader;

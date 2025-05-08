
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AppointmentForm from './AppointmentForm';
import DailySchedule from './schedule/DailySchedule';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AppointmentCalendar: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const startDate = viewMode === 'week' ? startOfWeek(date, { weekStartsOn: 1 }) : date;
  const endDate = viewMode === 'week' ? endOfWeek(date, { weekStartsOn: 1 }) : date;
  
  return (
    <div className="space-y-4">
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
        
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <Card className="h-fit">
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="p-3 pointer-events-auto"
            />
          </CardContent>
        </Card>
        
        <div className="flex flex-col space-y-4">
          <DailySchedule date={date} viewMode={viewMode} />
        </div>
      </div>
      
      <AppointmentForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        defaultDate={date}
      />
    </div>
  );
};

export default AppointmentCalendar;

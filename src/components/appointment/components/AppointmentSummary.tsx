
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from '@/types/appointment';

interface AppointmentSummaryProps {
  selectedService: Service | null;
  selectedDate: Date | undefined;
  selectedTime: string;
}

export function AppointmentSummary({ selectedService, selectedDate, selectedTime }: AppointmentSummaryProps) {
  if (!selectedService || !selectedDate || !selectedTime) {
    return null;
  }

  return (
    <div className="bg-muted p-4 rounded-md">
      <h3 className="font-medium mb-2">Resumo do Agendamento</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Serviço:</div>
        <div className="font-medium">{selectedService.name}</div>
        
        <div>Duração:</div>
        <div className="font-medium">{selectedService.duration} minutos</div>
        
        <div>Valor:</div>
        <div className="font-medium">R$ {selectedService.price}</div>
        
        <div>Data e Hora:</div>
        <div className="font-medium">
          {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}
        </div>
        
        <div>Confirmação:</div>
        <div className="font-medium">Por email</div>
      </div>
    </div>
  );
}

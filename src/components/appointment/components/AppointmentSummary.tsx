
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from '@/types/appointment';

interface AppointmentSummaryProps {
  selectedService: Service | null;
  selectedDate: Date | undefined;
  selectedTime: string;
  appliedCoupon?: any;
  finalPrice?: number;
}

export function AppointmentSummary({ 
  selectedService, 
  selectedDate, 
  selectedTime, 
  appliedCoupon,
  finalPrice 
}: AppointmentSummaryProps) {
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
        
        {appliedCoupon ? (
          <>
            <div>Valor original:</div>
            <div className="font-medium line-through text-gray-500">R$ {selectedService.price.toFixed(2)}</div>
            
            <div>Cupom aplicado:</div>
            <div className="font-medium text-green-600">{appliedCoupon.code}</div>
            
            <div>Desconto:</div>
            <div className="font-medium text-green-600">
              - R$ {appliedCoupon.discountAmount.toFixed(2)}
              {appliedCoupon.discountType === 'percentage' && ` (${appliedCoupon.discountValue}%)`}
            </div>
            
            <div className="col-span-2 border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Valor final:</span>
                <span className="font-bold text-lg text-green-600">R$ {finalPrice?.toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>Valor:</div>
            <div className="font-medium text-lg">R$ {selectedService.price.toFixed(2)}</div>
          </>
        )}
        
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


import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from '@/types/appointment';

interface AppointmentSummaryProps {
  selectedService: Service | null;
  appliedCoupon: { code: string; discountAmount: number } | null;
  finalServicePrice: number;
}

export function AppointmentSummary({ 
  selectedService, 
  appliedCoupon,
  finalServicePrice 
}: AppointmentSummaryProps) {
  if (!selectedService) {
    return null;
  }

  return (
    <div className="bg-stone-700/50 border border-stone-600 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        📋 Resumo do Agendamento
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-stone-300">Serviço:</span>
          <span className="text-white font-medium">{selectedService.name}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-stone-300">Duração:</span>
          <span className="text-white font-medium">{selectedService.duration} minutos</span>
        </div>
        
        {appliedCoupon ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-stone-300">Valor original:</span>
              <span className="text-stone-400 line-through">R$ {selectedService.price.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-stone-300">Cupom aplicado:</span>
              <span className="text-green-400 font-medium">{appliedCoupon.code}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-stone-300">Desconto:</span>
              <span className="text-green-400 font-medium">
                - R$ {appliedCoupon.discountAmount.toFixed(2)}
              </span>
            </div>
            
            <div className="border-t border-stone-600 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold text-lg">Valor final:</span>
                <span className="text-green-400 font-bold text-lg">R$ {finalServicePrice.toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-white font-bold text-lg">Valor:</span>
            <span className="text-amber-400 font-bold text-lg">R$ {selectedService.price.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

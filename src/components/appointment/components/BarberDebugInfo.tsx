
import React from 'react';
import { StaffMember } from '@/types/appointment';
// import { BarberAvailabilityInfo } from '../hooks/types';

interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
}

interface BarberDebugInfoProps {
  barbers: StaffMember[];
  barberAvailability: BarberAvailabilityInfo[];
  isCheckingAvailability: boolean;
}

export function BarberDebugInfo({ barbers, barberAvailability, isCheckingAvailability }: BarberDebugInfoProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg text-sm text-white">
      <h4 className="font-bold mb-2">Debug - Informações dos Barbeiros:</h4>
      
      <div className="mb-2">
        <strong>Total de barbeiros no banco:</strong> {barbers.length}
      </div>
      
      <div className="mb-2">
        <strong>Barbeiros ativos:</strong> {barbers.filter(b => b.is_active).length}
      </div>
      
      <div className="mb-2">
        <strong>Verificando disponibilidade:</strong> {isCheckingAvailability ? 'Sim' : 'Não'}
      </div>
      
      <div className="mb-2">
        <strong>Disponibilidade verificada:</strong> {barberAvailability.length} barbeiros
      </div>
      
      {barbers.length > 0 && (
        <div className="mb-2">
          <strong>Lista de barbeiros:</strong>
          <ul className="ml-4 mt-1">
            {barbers.map(barber => (
              <li key={barber.id} className={barber.is_active ? 'text-green-400' : 'text-red-400'}>
                {barber.name} - {barber.is_active ? 'Ativo' : 'Inativo'}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {barberAvailability.length > 0 && (
        <div>
          <strong>Disponibilidade:</strong>
          <ul className="ml-4 mt-1">
            {barberAvailability.map(barber => (
              <li key={barber.id} className={barber.available ? 'text-green-400' : 'text-red-400'}>
                {barber.name} - {barber.available ? 'Disponível' : 'Indisponível'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

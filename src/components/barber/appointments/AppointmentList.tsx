
import React from 'react';
import { AppointmentCard } from './AppointmentCard';

interface AppointmentListProps {
  appointments: any[];
  loading: boolean;
  updatingId: string | null;
  onComplete: (id: string) => void;
  onEdit: (id: string, startTime: string) => void;
  onCancel: (id: string) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  loading,
  updatingId,
  onComplete,
  onEdit,
  onCancel
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum agendamento encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          updatingId={updatingId}
          onComplete={onComplete}
          onEdit={onEdit}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
};

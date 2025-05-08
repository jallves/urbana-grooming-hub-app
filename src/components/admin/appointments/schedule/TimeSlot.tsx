
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeSlot as TimeSlotType } from './TimeSlotGenerator';
import AppointmentItem from './AppointmentItem';

interface TimeSlotProps {
  slot: TimeSlotType;
  onCreateAppointment: (time: Date) => void;
  onEditAppointment: (appointmentId: string) => void;
  viewMode: 'day' | 'week';
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  slot,
  onCreateAppointment,
  onEditAppointment,
  viewMode
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-500">{slot.label}</h3>
          {viewMode === 'day' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCreateAppointment(slot.time)}
            >
              + Agendar
            </Button>
          )}
        </div>
        
        {slot.appointments.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum agendamento</p>
        ) : (
          <div className="space-y-2">
            {slot.appointments.map((appointment) => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                onEdit={onEditAppointment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeSlot;

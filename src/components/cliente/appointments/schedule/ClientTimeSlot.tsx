
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ClientTimeSlot as ClientTimeSlotType } from './ClientTimeSlotGenerator';
import ClientAppointmentItem from './ClientAppointmentItem';

interface ClientTimeSlotProps {
  slot: ClientTimeSlotType;
  viewMode: 'day' | 'week';
}

const ClientTimeSlot: React.FC<ClientTimeSlotProps> = ({
  slot,
  viewMode
}) => {
  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-urbana-gold/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-400 font-raleway">{slot.label}</h3>
        </div>
        
        {slot.appointments.length === 0 ? (
          <p className="text-sm text-gray-500 font-raleway">Nenhum agendamento</p>
        ) : (
          <div className="space-y-2">
            {slot.appointments.map((appointment) => (
              <ClientAppointmentItem
                key={appointment.id}
                appointment={appointment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientTimeSlot;

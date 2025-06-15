
import React from "react";

interface ClientAppointmentHeaderProps {
  isEdit: boolean;
}

export function ClientAppointmentHeader({ isEdit }: ClientAppointmentHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-playfair">
        {isEdit ? 'Editar Agendamento' : 'Agendar Horário'}
      </h1>
      <p className="text-gray-300 text-lg">
        {isEdit ? 'Modifique os detalhes do seu agendamento' : 'Reserve seu momento de cuidado pessoal'}
      </p>
    </div>
  );
}

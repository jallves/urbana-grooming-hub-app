
import React from 'react';
import { useParams } from 'react-router-dom';
import ClientAppointmentForm from '@/components/appointment/ClientAppointmentForm';

const AppointmentBooking: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  if (!clientId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Cliente não encontrado</h1>
          <p>ID do cliente não foi fornecido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-clash">
            Agendar Horário
          </h1>
          <p className="text-[#9CA3AF] font-inter mt-2">
            Complete seu agendamento na barbearia
          </p>
        </div>

        <ClientAppointmentForm 
          onSuccess={() => {
            console.log('Agendamento realizado com sucesso!');
          }} 
        />
      </div>
    </div>
  );
};

export default AppointmentBooking;

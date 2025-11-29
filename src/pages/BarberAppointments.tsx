import React from 'react';
import BarberAppointmentsWithModal from '@/components/barber/BarberAppointmentsWithModal';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberPageContainer hideHeader>
      {/* Header da página */}
      <div className="mb-8 sm:mb-10 lg:mb-12 pb-6 sm:pb-8 border-b border-urbana-gold/20">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
          Meus Agendamentos
        </h1>
        <p className="text-urbana-light/70 text-sm sm:text-base lg:text-lg drop-shadow-md mt-1 sm:mt-2">
          Gerencie seus atendimentos
        </p>
      </div>
      
      <BarberAppointmentsWithModal />
    </BarberPageContainer>
  );
};

export default BarberAppointmentsPage;

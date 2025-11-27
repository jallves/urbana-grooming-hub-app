import React from 'react';
import BarberAppointmentsWithModal from '@/components/barber/BarberAppointmentsWithModal';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberPageContainer hideHeader>
      {/* Header da página */}
      <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-urbana-gold/20">
        <h1 className="text-2xl sm:text-3xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
          Meus Agendamentos
        </h1>
        <p className="text-urbana-light/70 text-sm sm:text-base drop-shadow-md mt-1">
          Gerencie seus atendimentos
        </p>
      </div>
      
      <BarberAppointmentsWithModal />
    </BarberPageContainer>
  );
};

export default BarberAppointmentsPage;

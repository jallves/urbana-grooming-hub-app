import React from 'react';
import BarberAppointmentsWithModal from '@/components/barber/BarberAppointmentsWithModal';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberPageContainer>
      <BarberAppointmentsWithModal />
    </BarberPageContainer>
  );
};

export default BarberAppointmentsPage;


import React from 'react';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberAppointmentsWithModal from '@/components/barber/BarberAppointmentsWithModal';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <StandardBarberLayout>
      <BarberAppointmentsWithModal />
    </StandardBarberLayout>
  );
};

export default BarberAppointmentsPage;

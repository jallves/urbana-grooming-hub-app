
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberAppointmentsWithModal from '@/components/barber/BarberAppointmentsWithModal';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberLayout title="Agendamentos">
      <StandardBarberLayout>
        <BarberAppointmentsWithModal />
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberAppointmentsPage;

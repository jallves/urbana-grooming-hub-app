
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberAppointments from '@/components/barber/BarberAppointments';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberLayout title="Agendamentos">
      <StandardBarberLayout>
        <BarberAppointments />
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberAppointmentsPage;

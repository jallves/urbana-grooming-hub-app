
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberAppointmentsComponent from '@/components/barber/BarberAppointments';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberLayout title="Agendamentos">
      <StandardBarberLayout>
        <div className="w-full h-full">
          <BarberAppointmentsComponent />
        </div>
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberAppointmentsPage;

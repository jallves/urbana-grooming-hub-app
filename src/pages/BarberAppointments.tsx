
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import BarberAppointmentsComponent from '@/components/barber/BarberAppointments';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberLayout title="Meus Agendamentos">
      <BarberAppointmentsComponent />
    </BarberLayout>
  );
};

export default BarberAppointmentsPage;

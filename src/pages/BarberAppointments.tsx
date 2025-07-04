
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import BarberAppointmentsComponent from '@/components/barber/BarberAppointments';

const BarberAppointmentsPage: React.FC = () => {
  return (
    <BarberLayout title="Meus Agendamentos">
      <div className="panel-content-responsive">
        <BarberAppointmentsComponent />
      </div>
    </BarberLayout>
  );
};

export default BarberAppointmentsPage;

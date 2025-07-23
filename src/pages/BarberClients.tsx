
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import BarberClientsComponent from '@/components/barber/BarberClients';

const BarberClientsPage: React.FC = () => {
  return (
    <BarberLayout title="Meus Clientes">
      <BarberClientsComponent />
    </BarberLayout>
  );
};

export default BarberClientsPage;

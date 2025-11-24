
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import StandardBarberLayout from '@/components/barber/layouts/StandardBarberLayout';
import BarberClientsComponent from '@/components/barber/BarberClients';

const BarberClientsPage: React.FC = () => {
  return (
    <StandardBarberLayout>
        <div className="w-full h-full">
          <BarberClientsComponent />
        </div>
      </StandardBarberLayout>
  );
};

export default BarberClientsPage;
